import os
import sys
import time
import requests
import shutil
import traceback
import platform # Para detectar OS
import logging
import logging.handlers
import subprocess

if getattr(sys, 'frozen', False):
    #.exe (PyInstaller)
    BASE_DIR = os.path.dirname(sys.executable)
else:
    #.py script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
#Configuración del Logging
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_file = os.path.join(BASE_DIR, 'bot_whatsapp.log')
logger = logging.getLogger('WhatsAppBot')
logger.setLevel(logging.INFO)
if logger.hasHandlers(): logger.handlers.clear()
try:
    max_bytes = 5 * 1024 * 1024  # 5 MB
    file_handler = logging.handlers.RotatingFileHandler(
        log_file, 
        mode='a', # 'a' (append) es mejor que 'w' (write) para rotación
        maxBytes=max_bytes, 
        backupCount=2, # Número de archivos de respaldo
        encoding='utf-8'
    )
    file_handler.setFormatter(log_formatter)
    logger.addHandler(file_handler)
except Exception as e: print(f"Error log file: {e}")
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, StaleElementReferenceException, TimeoutException, WebDriverException, ElementClickInterceptedException
)

class BotPrecioAGD:
    """
    Bot para monitorear precios de AGD desde WhatsApp y enviarlos a un backend.

    Este bot utiliza Selenium para controlar una sesión de WhatsApp Web,
    monitorea un chat específico en busca de mensajes que contengan precios,
    y envía estos mensajes a una API backend para su procesamiento.
    Gestiona la sesión de WhatsApp (incluyendo el escaneo de QR),
    maneja la autenticación con el backend y es robusto frente a errores
    comunes como la pérdida de sesión o fallos de conexión.
    """
    CONTACTO = "Nordesan"
    URL_LOGIN = os.environ.get("BACKEND_LOGIN_URL", "http://localhost:8080/login")
    URL_DESTINO = os.environ.get("BACKEND_PRECIOS_URL", "http://localhost:8080/precios/consultarAGD")
    USERNAME_LOGIN = "27221028940"
    PASSWORD_LOGIN = "clave123"
    QR_CODE_SELECTOR = 'div[data-ref]'
    CHAT_LIST_SELECTOR = '#pane-side'

    def __init__(self):
        """
        Inicializa el bot, configura el perfil de Chrome, y realiza el login inicial en el backend.
        """
        self.contacto = self.CONTACTO
        self.url_destino = self.URL_DESTINO
        self.api_username = self.USERNAME_LOGIN
        self.api_password = self.PASSWORD_LOGIN
        self.api_token = None
        self.driver = None
        self.chat_abierto = None
        default_profile_path = os.path.join(BASE_DIR, "chrome_profile_agd_local")
        self.perfil_chrome = os.environ.get("CHROME_PROFILE_PATH", default_profile_path)
        logger.info(f"Usando perfil: {self.perfil_chrome}")
        try: os.makedirs(self.perfil_chrome, exist_ok=True)
        except Exception as e: logger.error(f"No se pudo crear dir perfil: {e}")
        self.flag_mensaje_path = os.path.join(self.perfil_chrome, "ultimo_mensaje.txt")
        self.ultimo_mensaje_enviado = self.cargar_ultimo_mensaje()
        self.generic_error_counter = 0
        self._realizar_login()

    def limpiar_perfil(self):
        """
        Elimina el directorio del perfil de Chrome para forzar un reinicio limpio.
        """
        try:
            if os.path.exists(self.perfil_chrome): logger.info(f"Limpiando perfil..."); shutil.rmtree(self.perfil_chrome)
        except Exception as e: logger.warning(f"No se pudo limpiar perfil: {e}")

    def _realizar_login(self):
        """
        Realiza la autenticación contra el backend para obtener un token de API.

        Returns:
            bool: True si el login fue exitoso y se obtuvo un token, False en caso contrario.
        """
        if not self.api_username or not self.api_password: logger.error("Faltan credenciales."); return False
        logger.info("Login backend...")
        try:
            payload = {"cuil": self.api_username, "contrasena": self.api_password}
            response = requests.post(self.URL_LOGIN, json=payload, timeout=10)
            if response.status_code in [200, 201]: 
                token = response.json().get("access_token")
                if token: self.api_token = token; logger.info("Login OK."); return True
                else: logger.error("Login OK, sin token."); return False
            else: logger.error(f"Falló login: {response.status_code}"); return False
        except requests.exceptions.Timeout: logger.error(f"Timeout login."); return False
        except requests.exceptions.RequestException as e: logger.error(f"Error conexión login: {e}"); return False

    def cargar_ultimo_mensaje(self):
        """
        Carga el último mensaje enviado desde el archivo de bandera.

        Returns:
            list: Una lista con el texto del último mensaje y la fecha, o [None, None] si no se encuentra.
        """
        try:
            with open(self.flag_mensaje_path, "r", encoding="utf-8") as f:
                contenido = f.read().strip().split("||"); return contenido if len(contenido) == 2 else [None, None]
        except FileNotFoundError: logger.info(f"No se encontró {os.path.basename(self.flag_mensaje_path)}."); return [None, None]
        except Exception as e: logger.warning(f"Error cargando último msg: {e}"); return [None, None]

    def guardar_ultimo_mensaje(self, mensaje):
        """
        Guarda el mensaje recién enviado en el archivo de bandera para evitar duplicados.

        Args:
            mensaje (str): El texto del mensaje que se ha enviado.
        """
        try:
            hoy = time.strftime("%Y-%m-%d"); os.makedirs(os.path.dirname(self.flag_mensaje_path), exist_ok=True)
            with open(self.flag_mensaje_path, "w", encoding="utf-8") as f: f.write(f"{mensaje.strip()}||{hoy}")
            logger.info(f"Último mensaje guardado ({hoy}).")
        except Exception as e: logger.warning(f"Error guardando último msg: {e}")

    def enviar_mensaje_al_backend(self, mensaje, is_retry=False):
        """
        Envía el mensaje de precios extraído al endpoint del backend.

        Maneja la re-autenticación si el token ha expirado.

        Args:
            mensaje (str): El mensaje de precios a enviar.
            is_retry (bool): Flag interno para evitar bucles de re-autenticación.

        Returns:
            bool: True si el mensaje fue enviado exitosamente, False en caso contrario.
        """
        if not self.api_token:
            if not self._realizar_login(): return False
        headers = {"Authorization": f"Bearer {self.api_token}", "Content-Type": "application/json"}
        try:
            response = requests.post(self.url_destino, json={"mensaje": mensaje}, headers=headers, timeout=10)
            if response.status_code in [200, 201, 204]: return True
            elif response.status_code == 401 and not is_retry:
                logger.warning("Token expirado (401). Re-autenticando..."); self.api_token = None
                if self._realizar_login(): return self.enviar_mensaje_al_backend(mensaje, is_retry=True)
                else: logger.error("Falló re-autenticación post-401."); return False
            else: logger.warning(f"Error backend: {response.status_code}"); return False
        except requests.exceptions.Timeout: logger.error(f"Timeout enviando msg."); return False
        except requests.exceptions.RequestException as e: logger.error(f"Error conexión enviando msg: {e}"); return False

    def iniciar_driver(self, headless=False):
        """
        Inicia una nueva instancia del driver de Chrome (WebDriver).

        Puede iniciar en modo `headless` (sin interfaz gráfica) o `visible`.
        Se encarga de limpiar instancias previas del driver antes de crear una nueva.

        Args:
            headless (bool): Si es True, inicia Chrome en modo headless.

        Returns:
            bool: True si el driver se inició correctamente, False si hubo un error.
        """
        self._force_kill_drivers()
        lockfile_path = os.path.join(self.perfil_chrome, "SingletonLock")
        if os.path.exists(lockfile_path):
            logger.info(f"Limpiando {lockfile_path}...")
            try: os.remove(lockfile_path)
            except OSError as e: logger.warning(f"No se pudo: {e}.")
        # Asegurar que no haya driver activo ANTES de intentar iniciar
        if self.driver:
            logger.warning("Driver aún activo al llamar a iniciar_driver. Intentando cerrar...")
            self.shutdown_driver() # Llama a quit() y pausa
        mode = "Headless" if headless else "Visible"
        logger.info(f"Configurando Chrome ({mode})...")
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument(f"--user-data-dir={self.perfil_chrome}")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--window-size=1280,800")
        if headless:
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-in-process-stack-traces")
            chrome_options.add_argument("--disable-logging")
            chrome_options.add_argument("--log-level=3")
            chrome_options.add_argument("--disable-crash-reporter")
        else:
            chrome_options.add_argument("--start-maximized")
        try:
            logger.info(f"Iniciando webdriver.Chrome() ({mode})...")
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info(f"Webdriver ({mode}) iniciado.")
            return True # Éxito
        except WebDriverException as e:
            error_msg = str(e).split('\n')[0]
            logger.error(f"Error WebDriverException iniciando Chrome ({mode}): {error_msg}")
            if "cannot find chrome binary" in error_msg.lower(): logger.error("¡Google Chrome no parece estar instalado!")
            elif "unable to obtain driver" in error_msg.lower(): logger.error("Selenium Manager no pudo descargar/encontrar chromedriver.")
            elif "session not created: Chrome failed to start: crashed" in error_msg:
                logger.error(f"Chrome ({mode}) CRASHEÓ al iniciar. ¿Perfil corrupto o problema con modo headless?")
            else: logger.exception("Error detallado:") # Imprime traceback completo si es otro error
            self.driver = None
            return False
        except Exception as e:
            logger.critical(f"ERROR FATAL iniciando webdriver ({mode}):", exc_info=True)
            self.driver = None
            return False

    def sesion_activa(self):
        """
        Verifica si hay una sesión de WhatsApp activa en el navegador.

        Returns:
            bool: True si la sesión está activa (se encuentra la lista de chats), False en caso contrario.
        """
        if not self.driver: return False
        try: WebDriverWait(self.driver, 2).until(EC.presence_of_element_located((By.CSS_SELECTOR, self.CHAT_LIST_SELECTOR))); return True
        except: return False
        
    def monitorear_en_bucle(self):
        """
        Inicia el bucle principal de monitoreo de mensajes.

        Este bucle llama a `_monitorear_mensajes` repetidamente.
        Si la sesión se pierde, sale del bucle y devuelve una señal para reiniciar.
        Si ocurren 3 errores consecutivos, devuelve una señal "FATAL" para un reinicio completo.

        Returns:
            str or bool: False si la sesión se pierde (reinicio normal), "FATAL" si hay 3 errores.
        """
        logger.info(f"Iniciando bucle de monitoreo...")
        sesion_activa = True
        self.chat_abierto = None  
        while sesion_activa:
            monitor_result = self._monitorear_mensajes() # Puede ser True, False, o "FATAL"
            
            if monitor_result is True:
                time.sleep(15)
            else: 
                sesion_activa = False # Romper este bucle
                logger.warning(f"Saliendo de bucle de monitoreo con señal: {monitor_result}")
                return monitor_result # Devolver la señal (False o "FATAL")
        return False # Salida normal

    def _manejar_sesion_whatsapp(self):
        """
        Gestiona el inicio de sesión en WhatsApp Web.

        Abre WhatsApp Web en modo visible y espera a que el usuario escanee el código QR
        si es necesario. Confirma que la sesión se haya iniciado correctamente.

        Returns:
            bool: True si la sesión se estableció correctamente, False si hubo un error.
        """
        logger.info("Verificando sesión WhatsApp (Siempre Visible para Login/QR)...")
        if not self.driver:
            if not self.iniciar_driver(headless=False):
                logger.error("Fallo crítico al iniciar driver VISIBLE.")
                return False
        try:
            logger.info("Abriendo WhatsApp Web...")
            self.driver.set_page_load_timeout(60)
            self.driver.get("https://web.whatsapp.com/")
        except Exception as e: logger.error(f"Error cargando WA Web: {e}"); return False
        finally:
            try: self.driver.set_page_load_timeout(300)
            except: pass
        try:
            logger.info("Esperando carga inicial (QR o Chats)...")
            # Espera QR O la lista de chats
            WebDriverWait(self.driver, 60).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, f"{self.QR_CODE_SELECTOR}, {self.CHAT_LIST_SELECTOR}"))
            )
        except TimeoutException: logger.error("WhatsApp Web no cargó (ni QR ni Chats)."); return False
        if self.sesion_activa():
            logger.info("Sesión activa detectada (en modo visible).")
            return True
        logger.info("QR visible en navegador."); logger.info("👉 Escanea el QR..."); logger.info("   (~2 minutos)")
        try:
            WebDriverWait(self.driver, 120).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.CHAT_LIST_SELECTOR))
            )
            logger.info("Escaneo detectado! Sesión iniciada (en modo visible).")
            return True
        except TimeoutException: logger.error("Timeout escaneo."); return False
        except Exception as e: logger.exception(f"Error esperando escaneo:"); return False

    def _monitorear_mensajes(self):
        """
        Realiza una única iteración de monitoreo de mensajes.

        Verifica el estado de la sesión, abre el chat del contacto, busca nuevos mensajes,
        y si encuentra un mensaje relevante, lo envía al backend. Maneja un contador
        de errores para detectar fallos consecutivos.

        Returns:
            str or bool: True si el monitoreo fue exitoso, False si la sesión se perdió,
                         "FATAL" si se alcanzó el límite de errores.
        """
        if not self.driver: return False
        try:
            if self.generic_error_counter >= 3:
                logger.critical(f"FALLO CRÍTICO: Se detectaron 3 errores consecutivos.")
                logger.critical("Se forzará el borrado del perfil y reinicio total.")
                self.generic_error_counter = 0 
                return "FATAL" 
            try:
                qr_elements = self.driver.find_elements(By.CSS_SELECTOR, self.QR_CODE_SELECTOR)
                if qr_elements:
                    logger.warning("¡Sesión CERRADA! (QR detectado). Reiniciando...")
                    return False
                self.driver.find_element(By.CSS_SELECTOR, self.CHAT_LIST_SELECTOR)
            except NoSuchElementException:
                logger.warning("¡Sesión PERDIDA! (No se encontró el panel de chats). Reiniciando...")
                return False
            except WebDriverException as e:
                logger.error(f"Error WebDriver durante chequeo de sesión: {e}")
                return False
            if self.chat_abierto != self.contacto:
                chat = None
                chat_xpath = f'//span[@title="{self.contacto}"]'
                try:
                    panel = self.driver.find_element(By.CSS_SELECTOR, self.CHAT_LIST_SELECTOR)
                    self.driver.execute_script("arguments[0].scrollTop = 0;", panel)
                    logger.info("Scroll del panel de chats reseteado a 0.")
                    time.sleep(2.0)
                    logger.info("Buscando chat (span) en el 'top'...")
                    chat = self.driver.find_element(By.XPATH, chat_xpath)
                except NoSuchElementException:
                    logger.info(f"'{self.contacto}' no encontrado en 'top'. Iniciando bucle de scrolleo...")
                    intentos = 0
                    max_intentos_scroll = 10
                    while not chat and intentos < max_intentos_scroll:
                        try: 
                            panel = self.driver.find_element(By.CSS_SELECTOR, self.CHAT_LIST_SELECTOR); 
                            self.driver.execute_script("arguments[0].scrollTop += 500;", panel)
                            time.sleep(2.0)
                            chat = self.driver.find_element(By.XPATH, chat_xpath)
                        except NoSuchElementException:
                            intentos += 1
                            logger.info(f"No encontrado (intento {intentos+1} de {max_intentos_scroll})...")
                        except Exception as e_scroll:
                            logger.error(f"Error durante scrolleo: {e_scroll}")
                            self.generic_error_counter += 1
                            return True
                except Exception as e_find:
                    logger.error(f"Error buscando chat en 'top': {e_find}"); 
                    self.generic_error_counter += 1 
                    return True 
                if not chat: 
                    logger.warning(f"No se encontró '{self.contacto}' después de scrolleo completo."); 
                    self.generic_error_counter += 1 
                    return True
                try: 
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", chat)
                    time.sleep(0.5)
                    chat.click() # Intento de clic normal
                    self.chat_abierto = self.contacto
                    time.sleep(0.5)
                except ElementClickInterceptedException as e_click: 
                    # El clic normal fue interceptado
                    logger.warning(f"Clic normal interceptado: {str(e_click).splitlines()[0]}"); 
                    logger.warning("Plan B: Forzando clic con JavaScript...")
                    try:
                        #Clic forzado con JavaScript
                        self.driver.execute_script("arguments[0].click();", chat)
                        self.chat_abierto = self.contacto
                        time.sleep(0.5)
                    except Exception as e_js_click:
                        #sumamos strike
                        logger.error(f"¡FALLÓ CLIC JS! {e_js_click}");
                        self.chat_abierto = None
                        self.generic_error_counter += 1
                        logger.warning(f"Intento fallido {self.generic_error_counter} de 3.")
                        return True
                except (StaleElementReferenceException, WebDriverException, Exception) as e_open: 
                    logger.error(f" Error abriendo chat: {e_open}"); 
                    self.chat_abierto = None; 
                    self.generic_error_counter += 1
                    logger.warning(f"Intento fallido {self.generic_error_counter} de 3.")
                    return True
            mensajes_in = self.driver.find_elements(By.CSS_SELECTOR, "div.message-in")
            if not mensajes_in: return True 
            ultimo_msg_div = mensajes_in[-1]
            try:
                spans = ultimo_msg_div.find_elements(By.CSS_SELECTOR, "span.selectable-text span")
                ultimo_msg_texto = "\n".join([s.text for s in spans if s.text]).strip()
            except: return True 
            if not ultimo_msg_texto: return True 
            mensaje_guardado, fecha_guardada = self.cargar_ultimo_mensaje() 
            hoy = time.strftime("%Y-%m-%d")
            if "Los precios en disponible para el mercado de AGD" in ultimo_msg_texto:
                if ultimo_msg_texto != mensaje_guardado or fecha_guardada != hoy:
                    logger.info(f"Mensaje AGD:\n{ultimo_msg_texto[:100]}...")
                    if self.enviar_mensaje_al_backend(ultimo_msg_texto): self.guardar_ultimo_mensaje(ultimo_msg_texto)
        except (NoSuchElementException, StaleElementReferenceException): 
            logger.warning("Elemento desapareció (probablemente refrescando)."); 
            self.chat_abierto = None
            self.generic_error_counter += 1
            logger.warning(f"Intento fallido {self.generic_error_counter} de 3.")
            return True
        except WebDriverException as e: 
            logger.error(f"Error WebDriver monitoreo: {e}"); 
            return False
        except Exception as e: 
            logger.exception(f"Error inesperado monitoreo:"); 
            self.generic_error_counter += 1
            logger.warning(f"Intento fallido {self.generic_error_counter} de 3.")
            return True
        if self.generic_error_counter > 0:
            logger.info("Bucle de monitoreo exitoso, reiniciando contador de errores a 0.")
            self.generic_error_counter = 0
        return True

    def run(self):
            """
            Punto de entrada principal para ejecutar el bot.

            Este método contiene el ciclo de vida principal del bot:
            1. Intenta iniciar en modo `headless` si ya existe un perfil de Chrome.
            2. Si falla o no hay perfil, pasa a modo `visible` para el login manual (QR).
            3. Entra en el bucle de monitoreo.
            4. Si el monitoreo detecta una sesión perdida, reinicia el ciclo.
            5. Si detecta un error fatal, limpia el perfil y reinicia el ciclo.
            Maneja interrupciones por teclado y errores catastróficos para un apagado seguro.
            """
            logger.info("Bot iniciado.")
            local_storage_path = os.path.join(self.perfil_chrome, "Default", "Local Storage", "leveldb")
            while True:
                try:
                    logger.info(f"Revisando existencia de perfil...")
                    sesion_posible = os.path.exists(local_storage_path)
                    if sesion_posible:
                        logger.info("Perfil con datos encontrado. Intentando HEADLESS...")
                        driver_iniciado_ok = self.iniciar_driver(headless=True) 
                        if driver_iniciado_ok:
                            logger.info("Abriendo WhatsApp Web (headless)...")
                            self.driver.set_page_load_timeout(45)
                            try:
                                self.driver.get("https://web.whatsapp.com/")
                                WebDriverWait(self.driver, 30).until(
                                    EC.presence_of_element_located((By.CSS_SELECTOR, self.CHAT_LIST_SELECTOR))
                                )
                                logger.info("¡Sesión activa en HEADLESS detectada! Monitoreando...")
                                self.driver.set_page_load_timeout(300)
                                monitor_result = self.monitorear_en_bucle()                                
                                logger.info("Cerrando driver headless...")
                                self.shutdown_driver()
                                if monitor_result == "FATAL":
                                    logger.critical("Bucle fatal detectado en HEADLESS. Limpiando perfil...")
                                    self.limpiar_perfil()
                            except (TimeoutException, WebDriverException) as e:
                                logger.warning(f"Perfil encontrado, pero sesión inválida (necesita QR). Fallback a Visible.")
                                self.shutdown_driver() 
                                sesion_posible = False 
                            finally:
                                try: self.driver.set_page_load_timeout(300)
                                except: pass
                        else:
                            logger.error("Fallo crítico al iniciar driver HEADLESS. Forzando modo Visible...")
                            sesion_posible = False                    
                    if not sesion_posible:
                        logger.info("Perfil vacío o sesión headless fallida. Iniciando en VISIBLE...")
                        session_visible_ok = self._manejar_sesion_whatsapp() 
                        if session_visible_ok:
                            logger.info("Sesión iniciada en modo VISIBLE. Monitoreando...")                            
                            monitor_result_visible = self.monitorear_en_bucle()
                            logger.info("Cerrando driver visible...")
                            self.shutdown_driver() # Siempre cerrar driver al salir del bucle
                            if monitor_result_visible == "FATAL":
                                logger.critical("Bucle fatal detectado en VISIBLE. Limpiando perfil...")
                                self.limpiar_perfil() 
                        else:
                            logger.error("Falló el inicio de sesión VISIBLE (ej. timeout QR). Reintentando ciclo en 30s...")
                            self.shutdown_driver()
                            time.sleep(30)
                except KeyboardInterrupt: 
                    logger.info("\nDetención por usuario (KeyboardInterrupt).")
                    break 
                except Exception as e:
                    logger.critical(f"Error catastrófico en run():", exc_info=True)
                    self.shutdown_driver()
                    self.limpiar_perfil() # Limpiar perfil también en un crash catastrófico
                    logger.info("Reiniciando en 30s...")
                    time.sleep(30)
            logger.info("Saliendo de run()... Llamando a shutdown() final.")
            self.shutdown()

    def shutdown_driver(self):
        """
        Cierra la instancia actual del driver de Chrome de forma segura.
        """
        if self.driver:
            logger.info("Cerrando driver...")
            try: self.driver.quit()
            except Exception as e: logger.warning(f"Error cerrando: {e}")
            finally: 
                self._force_kill_drivers()
                self.driver = None; time.sleep(3)

    def shutdown(self):
        """
        Realiza el apagado completo y limpio del bot.
        """
        logger.info("\nDeteniendo el bot...")
        self.shutdown_driver()
        logger.info("Bot detenido.")

    def _force_kill_drivers(self):
            """
            Fuerza el cierre de todos los procesos de chromedriver y Chrome asociados a este perfil.

            Esto es una medida de seguridad para evitar procesos zombis que puedan
            bloquear el perfil de Chrome en futuros inicios. Es específico para
            el sistema operativo (Windows, Linux, macOS).
            """
            logger.info("Intentando forzar cierre de drivers Y chrome (solo de este perfil)...")
            system = platform.system()
            #Configuración para ocultar ventanas en Windows
            startupinfo = None
            kwargs = {"stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL, "shell": True}
            if system == "Windows":
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
                kwargs["startupinfo"] = startupinfo
            try:
                # 1. Matar chromedriver (esto es seguro y rápido)
                if system == "Windows":
                    cmd_driver = "taskkill /F /IM chromedriver.exe /T"
                    subprocess.run(cmd_driver, **kwargs)
                else: # Linux/macOS
                    cmd_driver = "pkill -9 -f 'chromedriver'"
                    subprocess.run(cmd_driver, **kwargs)
                logger.info("Comando kill (chromedriver) ejecutado.")
                time.sleep(0.5) # Pequeña pausa
                # 2. Matar chrome.exe (solo el que usa nuestro perfil)
                profile_dir_name = os.path.basename(self.perfil_chrome) # "chrome_profile_agd_local"
                if system == "Windows":
                    command = f'wmic process where "name=\'chrome.exe\' and commandline like \'%{profile_dir_name}%\'" delete'
                    logger.info(f"Ejecutando: wmic ... like '%{profile_dir_name}%'...")
                    subprocess.run(command, **kwargs)
                else: # Linux/macOS
                    command = f"pkill -9 -f \"chrome.*{profile_dir_name}\""
                    logger.info(f"Ejecutando: pkill -f ...{profile_dir_name}...")
                    subprocess.run(command, **kwargs)                
                logger.info("Comando kill (chrome específico del perfil) ejecutado.")
            except Exception as e:
                logger.warning(f"Error al ejecutar comando kill quirúrgico: {e}")

if __name__ == "__main__":
    logger.info("="*30 + " INICIO EJECUCIÓN BOT " + "="*30)
    bot = None
    try:
        bot = BotPrecioAGD()
        bot.run()
    except KeyboardInterrupt: 
        logger.info("\nDetención por KeyboardInterrupt (detectado en __main__).")
    except Exception as e: 
        logger.critical(f"Error fatal __main__:", exc_info=True)
    finally:
        logger.info("Bloque __main__ finally alcanzado.")
        if bot: 
            logger.info("Llamando a bot.shutdown() desde __main__ finally...")
            bot.shutdown()
        else: 
            logger.info("Limpieza final (sin instancia de bot).")
        logging.shutdown()
        logger.info("="*30 + " FIN EJECUCIÓN BOT " + "="*30)    