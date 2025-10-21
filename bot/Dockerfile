# ---- Etapa 1: Imagen Base de Python ----
    FROM python:3.11-bookworm
# Evita que 'apt' haga preguntas interactivas
ENV DEBIAN_FRONTEND=noninteractive

# ---- Etapa 2: Instalar dependencias de Chrome ----
# Instalamos las herramientas para añadir el repositorio de Chrome
RUN rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get update \
    && apt-get install -y \
    gnupg \
    wget \
    unzip \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ---- Etapa 3: Instalar Google Chrome (El Navegador) ----
# Añadimos la clave y el repositorio de Google
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
# Instalamos el navegador
RUN apt-get update \
    && apt-get install -y google-chrome-stable \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ---- Etapa 4: Instalar ChromeDriver (El Driver) ----
# Descubrimos la última versión ESTABLE de ChromeDriver
RUN CHROME_DRIVER_VERSION=$(wget -q -O - https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_STABLE) \
    # Descargamos e instalamos el driver
    && wget -q --continue -P /tmp https://storage.googleapis.com/chrome-for-testing-public/$CHROME_DRIVER_VERSION/linux64/chromedriver-linux64.zip \
    && unzip -q /tmp/chromedriver-linux64.zip -d /tmp \
    && mv /tmp/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver \
    && chown root:root /usr/local/bin/chromedriver \
    && chmod 755 /usr/local/bin/chromedriver \
    && rm /tmp/chromedriver-linux64.zip

# ---- Etapa 5: Configuración del Bot de Python ----
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ---- Etapa 6: Ejecución ----
CMD ["python", "botPrecioAGD.py"]