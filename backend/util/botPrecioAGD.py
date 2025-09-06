# botPrecioAGD.py
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
    # Configuración del bot
    CONTACTO = "Fran"
    TRIGGER_MSG = "Buenas tardes, señor productor 👨🏼‍🌾. Los precios en disponible para el mercado de AGD del día de hoy son"
    URL_DESTINO = "http://localhost:8000/precio/consultarAGD"
    
    def __init__(self):
        self.contacto = BotPrecioAGD.CONTACTO
        self.trigger_msg = BotPrecioAGD.TRIGGER_MSG
        self.url_destino = BotPrecioAGD.URL_DESTINO
        self.driver = None
        self._stop_flag = False

    def iniciar_driver(self):
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        #chrome_options.add_argument("--headless=new")  # sacar si querés ver navegador
        self.driver = webdriver.Chrome(options=chrome_options)

    def escuchar(self):
        self.iniciar_driver()
        self.driver.get("https://web.whatsapp.com/")
        print("👉 Escaneá el QR de WhatsApp Web (tenés ~30s)...")

        # Espera hasta que desaparezca el QR (usuario logueado)
        try:
            WebDriverWait(self.driver, 40).until_not(
                EC.presence_of_element_located((By.CSS_SELECTOR, "canvas[aria-label='Scan this QR code to link a device!'], div[data-ref]"))
            )
            print("✅ Sesión iniciada en WhatsApp Web")
        except TimeoutException:
            print("⏳ No se detectó inicio de sesión, deteniendo...")
            self.stop()
            return

        while not self._stop_flag:
            try:
                # Detecta si vuelve a aparecer el QR → sesión cerrada
                qr_elements = self.driver.find_elements(By.CSS_SELECTOR, "canvas[aria-label='Scan this QR code to link a device!'], div[data-ref]")
                if qr_elements:
                    print("⚠️ Sesión cerrada, QR visible → deteniendo bot...")
                    self.stop()
                    break

                # Abrir chat del contacto cada loop
                chat = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, f'//span[@title="{self.contacto}"]'))
                )
                chat.click()

                # Buscar mensajes entrantes
                mensajes = self.driver.find_elements(By.CSS_SELECTOR, "div.message-in span.selectable-text")
                if mensajes:
                    ultimo = mensajes[-1].text.strip()
                    if self.trigger_msg in ultimo:
                        print(f"⚡ Trigger detectado: {ultimo}")
                        requests.post(self.url_destino, json={"mensaje": ultimo})
                        time.sleep(5)

            except (NoSuchElementException, StaleElementReferenceException):
                print("🔄 Elemento no encontrado o DOM cambió, reintentando...")
                time.sleep(2)
                continue
            except Exception as e:
                print("❌ Error en el loop:", e)
                time.sleep(3)
                continue

    def start(self):
        self.thread = threading.Thread(target=self.escuchar, daemon=True)
        self.thread.start()

    def stop(self):
        self._stop_flag = True
        if self.driver:
            self.driver.quit()
