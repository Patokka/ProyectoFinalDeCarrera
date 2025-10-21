# botPrecioAGD.py
import os
import time
import requests
import shutil
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, StaleElementReferenceException, TimeoutException
)

class BotPrecioAGD:
    CONTACTO = "Fran" 
    URL_LOGIN = os.environ.get("BACKEND_LOGIN_URL", "http://localhost:8080/login")
    URL_DESTINO = os.environ.get("BACKEND_PRECIOS_URL", "http://localhost:8080/precios/consultarAGD")
    USERNAME_LOGIN = "27221028940"
    PASSWORD_LOGIN = "clave123"

    def __init__(self):
        self.contacto = self.CONTACTO
        self.url_destino = self.URL_DESTINO
        self.api_username = self.USERNAME_LOGIN
        self.api_password = self.PASSWORD_LOGIN
        self.api_token = None
        self.driver = None
        self.chat_abierto = None
        
        self.perfil_chrome = os.environ.get("CHROME_PROFILE_PATH", "/app/bot/chrome_profile_agd")
        self.flag_mensaje_path = os.path.join(self.perfil_chrome, "ultimo_mensaje.txt")
        self.ultimo_mensaje_enviado = self.cargar_ultimo_mensaje()
        
        # Opcional: Forzar una sesión limpia cada vez, borrando el perfil
        # self.limpiar_perfil() 
        
        self._realizar_login()

    def limpiar_perfil(self):
        """
        Borra la carpeta del perfil de Chrome para forzar un inicio de sesión
        con QR limpio cada vez. Útil para depuración.
        """
        try:
            if os.path.exists(self.perfil_chrome):
                print(f"🧹 Limpiando perfil de Chrome antiguo en: {self.perfil_chrome}")
                shutil.rmtree(self.perfil_chrome)
        except Exception as e:
            print(f"⚠️ No se pudo limpiar el perfil: {e}")

    def _realizar_login(self):
        if not self.api_username or not self.api_password:
            print("❌ No se puede hacer login: Faltan credenciales.")
            return False
        
        print("🔑 Intentando iniciar sesión en el backend...")
        try:
            payload = {"cuil": self.api_username, "contrasena": self.api_password}
            response = requests.post(self.URL_LOGIN, json=payload)

            if response.status_code in [200, 201]:
                token = response.json().get("access_token") 
                if token:
                    self.api_token = token
                    print("✅ Login exitoso. Token JWT obtenido.")
                    return True
                else:
                    print("❌ Error de login: La respuesta del backend no contiene un 'access_token'.")
                    return False
            else:
                print(f"❌ Falló el login: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Error de conexión durante el login: {e}")
            return False

    def cargar_ultimo_mensaje(self):
        try:
            with open(self.flag_mensaje_path, "r", encoding="utf-8") as f:
                contenido = f.read().strip().split("||")
                return contenido if len(contenido) == 2 else [None, None]
        except FileNotFoundError:
            return [None, None]

    def guardar_ultimo_mensaje(self, mensaje):
        hoy = time.strftime("%Y-%m-%d")
        os.makedirs(self.perfil_chrome, exist_ok=True)
        with open(self.flag_mensaje_path, "w", encoding="utf-8") as f:
            f.write(f"{mensaje.strip()}||{hoy}")
    
    def enviar_mensaje_al_backend(self, mensaje, is_retry=False):
        if not self.api_token:
            if not self._realizar_login():
                print("❌ No se pudo re-autenticar. Envío cancelado.")
                return False
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(self.url_destino, json={"mensaje": mensaje}, headers=headers)
            if response.status_code == 200:
                print(f"📡 Mensaje enviado al backend correctamente (código {response.status_code}).")
                return True
            elif response.status_code == 401 and not is_retry:
                print("⚠️ Token expirado o inválido (401). Intentando re-autenticar...")
                if self._realizar_login():
                    print("🔄 Re-autenticación exitosa. Reintentando enviar mensaje...")
                    return self.enviar_mensaje_al_backend(mensaje, is_retry=True)
                else:
                    print("❌ Falló la re-autenticación. No se pudo enviar el mensaje.")
                    return False
            else:
                print(f"⚠️ Respuesta inesperada del backend: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Error de conexión al enviar al backend: {e}")
            return False

    def iniciar_driver(self, forzar_visible=False):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument(f"--user-data-dir={self.perfil_chrome}")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        
        if not forzar_visible:
            chrome_options.add_argument("--headless=new")
        
        self.driver = webdriver.Chrome(options=chrome_options)

    #LÓGICA DE SESIÓN
    def sesion_activa(self):
        """
        Verifica si la sesión está activa buscando el panel lateral de chats.
        """
        try:
            # Si existe el panel lateral, la sesión está iniciada.
            self.driver.find_element(By.ID, "pane-side")
            return True
        except Exception:
            return False

    def _manejar_sesion_whatsapp(self):
        """
        Gestiona el inicio de sesión. Espera el QR o la lista de chats.
        Si aparece el QR, cambia a modo visible y espera el escaneo.
        """
        print("🔄 Verificando sesión de WhatsApp...")
        self.iniciar_driver(forzar_visible=True) # Iniciar sin headless
        self.driver.get("https://web.whatsapp.com/")

        try:
            # Esperamos 60 seg a que aparezca UNO de los dos:
            # 1. El QR ('div[data-ref]')
            # 2. La lista de chats ('#pane-side')
            WebDriverWait(self.driver, 60).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-ref], #pane-side"))
            )
        except TimeoutException:
            print("❌ WhatsApp Web no cargó. Ni QR ni chat list encontrados. Reintentando...")
            return False

        #verificamos si la sesión ya está activa
        if self.sesion_activa():
            print("✅ Sesión de WhatsApp activa detectada.")
            return True

        # Si no está activa, significa que el QR está visible.
        # Cambiamos a modo visible para el escaneo.
        print("⚠️ Se requiere iniciar sesión. Cambiando a modo visible.")
        self.iniciar_driver(forzar_visible=True)
        self.driver.get("https://web.whatsapp.com/")
        print("👉 Escanea el QR de WhatsApp Web (tienes ~60 segundos)...")
        
        try:
            # Esperamos (hasta 60 seg) a que el usuario escanee
            # y aparezca la lista de chats ('#pane-side').
            WebDriverWait(self.driver, 60).until(
                EC.presence_of_element_located((By.ID, "pane-side"))
            )
            print("✅ Sesión de WhatsApp iniciada correctamente.")
            return True
        except TimeoutException:
            print("⏳ Tiempo de espera agotado. No se detectó inicio de sesión.")
            return False
    
    def _monitorear_mensajes(self):
            """
            Busca, lee y procesa los nuevos mensajes del contacto definido.
            """
            try:
                if self.chat_abierto != self.contacto:
                    chat = None
                    intentos = 0
                    max_intentos_scroll = 10 # Intentará scrollear 10 veces como máximo

                    while not chat and intentos < max_intentos_scroll:
                        try:
                            chat = self.driver.find_element(By.XPATH, f'//span[@title="{self.contacto}"]')
                        except NoSuchElementException:
                            print(f"🔄 Contacto '{self.contacto}' no visible. Scrolleando lista... (Intento {intentos + 1}/{max_intentos_scroll})")
                            try:
                                panel_chats = self.driver.find_element(By.ID, "pane-side")
                                self.driver.execute_script("arguments[0].scrollTop += 500;", panel_chats)
                            except NoSuchElementException:
                                print("❌ No se encontró el panel de chats '#pane-side' para scrollear.")
                                break
                            time.sleep(1)
                            intentos += 1

                    if not chat:
                        print(f"❌ No se pudo encontrar el chat de '{self.contacto}' después de {max_intentos_scroll} intentos de scroll.")
                        raise TimeoutException(f"No se pudo encontrar el chat de '{self.contacto}'.")
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", chat)
                    time.sleep(0.5)
                    chat.click()
                    
                    self.chat_abierto = self.contacto
                    print(f"💬 Chat con '{self.contacto}' abierto.")
                    time.sleep(2)

                mensajes = self.driver.find_elements(By.CSS_SELECTOR, "div.message-in")
                if not mensajes: return

                ultimo_msg_spans = mensajes[-1].find_elements(By.CSS_SELECTOR, "span.selectable-text")
                ultimo_msg_texto = "\n".join([span.text for span in ultimo_msg_spans]).strip()

                if not ultimo_msg_texto: return

                mensaje_guardado, fecha_guardada = self.ultimo_mensaje_enviado
                hoy = time.strftime("%Y-%m-%d")

                if "Los precios en disponible para el mercado de AGD" in ultimo_msg_texto:
                    if ultimo_msg_texto != mensaje_guardado or fecha_guardada != hoy:
                        print(f"⚡ Mensaje de precios detectado:\n{ultimo_msg_texto}")
                        if self.enviar_mensaje_al_backend(ultimo_msg_texto):
                            self.guardar_ultimo_mensaje(ultimo_msg_texto)
                            self.ultimo_mensaje_enviado = [ultimo_msg_texto, hoy]

            except (NoSuchElementException, StaleElementReferenceException):
                print("🔄 Elemento no encontrado (DOM cambió). Forzando reapertura de chat...")
                self.chat_abierto = None
            except TimeoutException:
                print(f"⏳ No se pudo encontrar el chat de '{self.contacto}'. Verifica que el contacto exista.")
            except Exception as e:
                print(f"❌ Error inesperado en el monitoreo: {e}")

    def run(self):
        """
        Bucle principal del bot. Gestiona la sesión y monitorea mensajes.
        """
        print("▶️ Bot iniciado.")
        while True:
            try:
                if not self._manejar_sesion_whatsapp():
                    print("❌ No se pudo iniciar la sesión de WhatsApp. Saliendo.")
                    break

                print(" M o n i t o r e a n d o  💬")
                # Bucle interno: monitorea mientras la sesión esté activa
                while self.sesion_activa():
                    self._monitorear_mensajes()
                    time.sleep(15)
                
                print("⚠️ Se ha perdido la sesión de WhatsApp. Intentando reconectar...")
                self.chat_abierto = None
                time.sleep(5)
            
            except Exception as e:
                print(f"❌ Error catastrófico en el bucle principal: {e}")
                print("🔄 Reiniciando el bucle en 30 segundos...")
                time.sleep(30)

    def shutdown(self):
        """
        Detiene el bot y cierra el navegador de forma segura.
        """
        print("🛑 Deteniendo el bot...")
        if self.driver:
            try:
                self.driver.quit()
                self.driver = None
                print("✅ Driver de Selenium cerrado correctamente.")
            except Exception as e:
                print(f"❌ Error al cerrar el driver: {e}")

if __name__ == "__main__":
    bot = BotPrecioAGD()
    try:
        bot.run()
    except KeyboardInterrupt:
        print("\n🛑 Detención solicitada por el usuario (Ctrl+C).")
    finally:
        bot.shutdown() # Asegura que el driver se cierre al salir