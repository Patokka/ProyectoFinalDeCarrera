# botPrecioAGD.py
import os
import time
import requests
import threading
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
    TRIGGER_MSG = "Buenas tardes, señor productor 👨🏼‍🌾. Los precios en disponible para el mercado de AGD del día de hoy son"
    URL_DESTINO = "http://localhost:8000/precios/consultarAGD"

    def sesion_guardada(self):
        return os.path.exists(self.flag_sesion_path)


    def cargar_ultimo_mensaje(self):
        try:
            with open("ultimo_mensaje.txt", "r", encoding="utf-8") as f:
                contenido = f.read().strip().split("||")
                return contenido if len(contenido) == 2 else [None, None]
        except FileNotFoundError:
            return [None, None]

    def guardar_ultimo_mensaje(self, mensaje):
        hoy = time.strftime("%Y-%m-%d")
        os.makedirs(self.perfil_chrome, exist_ok=True)
        with open(self.flag_mensaje_path, "w", encoding="utf-8") as f:
            f.write(f"{mensaje.strip()}||{hoy}")

    def esperar_hilo(self, timeout=None):
        if hasattr(self, 'thread') and self.thread.is_alive():
            self.thread.join(timeout)
            print("✅ Hilo finalizado correctamente")

    def enviar_mensaje_al_backend(self, mensaje, max_intentos=3):
        intentos = 0
        while intentos < max_intentos:
            try:
                response = requests.post(self.url_destino, json={"mensaje": mensaje})
                if response.status_code == 200:
                    print(f"📡 Enviado al backend: {response.status_code}")
                    return True
                else:
                    print(f"⚠️ Respuesta del backend: {response.status_code}")
            except Exception as e:
                print(f"❌ Error al enviar al backend: {e}")
            intentos += 1
            time.sleep(5)
        return False

    def __init__(self):
        self.contacto = BotPrecioAGD.CONTACTO
        self.trigger_msg = BotPrecioAGD.TRIGGER_MSG
        self.url_destino = BotPrecioAGD.URL_DESTINO
        self.driver = None
        self._stop_flag = False
        self._session_closed = False
        self.chat_abierto = None
        self.perfil_chrome = os.path.abspath("chrome_profile_agd")
        self.flag_sesion_path = os.path.join(self.perfil_chrome, "sesion_ok.flag")
        self.flag_mensaje_path = os.path.join(self.perfil_chrome, "ultimo_mensaje.txt")
        self.ultimo_mensaje_enviado = self.cargar_ultimo_mensaje()


    def iniciar_driver(self, forzar_visible=False):
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument(f"--user-data-dir={os.path.abspath('chrome_profile_agd')}")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        if not forzar_visible:
            chrome_options.add_argument("--headless=new")
            print("🔍 Intentando iniciar en modo headless...")
        else:
            print("🖥️ Iniciando con navegador visible...")
        self.driver = webdriver.Chrome(options=chrome_options)


    def escuchar(self):
        self.iniciar_driver(forzar_visible=False)
        self.driver.get("https://web.whatsapp.com/")
        time.sleep(5)

        # Verificamos si el QR sigue visible
        qr_visible = False
        try:
            qr_visible = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "canvas[aria-label='Scan this QR code to link a device!'], div[data-ref]"))
            )
        except TimeoutException:
            qr_visible = False

        if qr_visible:
            print("⚠️ QR detectado en modo headless → reiniciando en modo visible")
            self.driver.quit()
            self.iniciar_driver(forzar_visible=True)
            self.driver.get("https://web.whatsapp.com/")
            print("👉 Escaneá el QR de WhatsApp Web (tenés ~30s)...")

            try:
                WebDriverWait(self.driver, 40).until_not(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "canvas[aria-label='Scan this QR code to link a device!'], div[data-ref]"))
                )
                print("✅ Sesión iniciada en WhatsApp Web")
                os.makedirs(self.perfil_chrome, exist_ok=True)
                with open(self.flag_sesion_path, "w") as f:
                    f.write("ok")
            except TimeoutException:
                print("⏳ No se detectó inicio de sesión, deteniendo...")
                self.stop()
                return
        else:
            print("✅ Sesión activa detectada en modo headless")

        while not self._stop_flag:
            try:
                qr_elements = self.driver.find_elements(By.CSS_SELECTOR, "canvas[aria-label='Scan this QR code to link a device!'], div[data-ref]")
                if qr_elements:
                    print("⚠️ Sesión cerrada, QR visible → deteniendo bot...")
                    self._session_closed = True
                    self.stop()
                    break

                # Abrir el chat si no está abierto
                if self.chat_abierto != self.contacto:
                    try:
                        chat = WebDriverWait(self.driver, 10).until(
                            EC.presence_of_element_located((By.XPATH, f'//span[@title="{self.contacto}"]'))
                        )
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", chat)

                        # Eliminar overlays que puedan bloquear el clic
                        self.driver.execute_script("""
                            const overlays = document.querySelectorAll('.x1lkfr7t, .xdbd6k5, .x1fcty0u, .x1kjfwcu');
                            overlays.forEach(el => el.remove());
                        """)

                        # Intentar clic normal
                        try:
                            WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable((By.XPATH, f'//span[@title="{self.contacto}"]')))
                            chat.click()
                        except Exception:
                            print("⚠️ Clic normal falló, intentando con JavaScript")
                            self.driver.execute_script("arguments[0].click();", chat)

                        self.chat_abierto = self.contacto  # marcar como abierto
                    except Exception as e:
                        print(f"❌ No se pudo clicar el chat de {self.contacto}: {e}")
                        time.sleep(2)
                        continue

                mensajes = self.driver.find_elements(By.CSS_SELECTOR, "div.message-in")

                if mensajes:
                    ultimo_msg_texto = ""
                    for span in mensajes[-1].find_elements(By.CSS_SELECTOR, "span.selectable-text"):
                        ultimo_msg_texto += span.text + "\n"
                    ultimo_msg_texto = ultimo_msg_texto.strip()

                    mensaje_guardado, fecha_guardada = self.ultimo_mensaje_enviado
                    hoy = time.strftime("%Y-%m-%d")

                    if "Los precios en disponible para el mercado de AGD" in ultimo_msg_texto:
                        if ultimo_msg_texto != mensaje_guardado or fecha_guardada != hoy:
                            print(f"⚡ Trigger detectado:\n{ultimo_msg_texto}")
                            enviado = self.enviar_mensaje_al_backend(ultimo_msg_texto)
                            self.ultimo_mensaje_enviado = [ultimo_msg_texto, hoy]
                            self.guardar_ultimo_mensaje(ultimo_msg_texto)
                            if not enviado:
                                print("⚠️ No se pudo enviar el mensaje al backend después de 3 intentos, se ignora para evitar duplicados.")
                            time.sleep(5)
                        else:
                            print("⏩ Mensaje ya fue enviado hoy, ignorando...")
            except (NoSuchElementException, StaleElementReferenceException):
                print("🔄 Elemento no encontrado o DOM cambió, reintentando...")
                time.sleep(2)
                continue
            except Exception as e:
                print("❌ Error en el loop:", e)
                time.sleep(3)
                continue
            print("Reintentando loop después de 60 segundos...")
            time.sleep(60)
        print("🔚 Loop finalizado. Saliendo del hilo.")
        return

    def start(self):
        self._stop_flag = False
        self._session_closed = False
        self.thread = threading.Thread(target=self.escuchar)
        self.thread.start()

    def stop(self):
        self._stop_flag = True
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
        except Exception as e:
            print(f"Error al cerrar el driver: {e}")

##Esto por si se ejecuta por separado por pruebas apartes solo del bot.
"""if __name__ == "__main__":
    bot = BotPrecioAGD()
    bot.start()
    try:
        while not bot._session_closed:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Bot detenido por el usuario (Ctrl+C)")
    finally:
        bot.stop()
        bot.esperar_hilo()"""