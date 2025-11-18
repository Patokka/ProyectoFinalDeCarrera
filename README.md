# Sistema de Gestión de Arrendamientos Rurales v2.0

Este repositorio contiene el código fuente para un sistema integral diseñado para la gestión de arrendamientos rurales. La solución incluye un backend robusto, un frontend moderno e intuitivo, una base de datos relacional y un bot automatizado para el scraping de precios, todo orquestado para un despliegue sencillo y eficiente.

---

## 📜 Índice

- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Características Principales](#-características-principales)
- [Puesta en Marcha (Setup)](#-puesta-en-marcha-setup)
  - [Prerrequisitos](#prerrequisitos)
  - [Configuración de Entorno](#configuración-de-entorno)
  - [Comandos de Docker](#comandos-de-docker)
- [Configuración del Bot de Precios](#-configuración-del-bot-de-precios)
  - [Creación del Ejecutable](#creación-del-ejecutable)
  - [Programar Tarea en Windows](#programar-tarea-en-windows)
  - [Visualización de Logs](#visualización-de-logs)
- [Acceso a la Red y Firewall](#-acceso-a-la-red-y-firewall)
- [Sistema de Backups](#-sistema-de-backups)

---

## 🏗️ Arquitectura del Sistema

El sistema se compone de cuatro servicios principales que trabajan en conjunto:

- **Backend:** Una API RESTful desarrollada con **FastAPI (Python)**, encargada de toda la lógica de negocio, autenticación y gestión de datos.
- **Frontend:** Una aplicación de una sola página (SPA) construida con **Next.js (React/TypeScript)**, que proporciona una interfaz de usuario interactiva y amigable.
- **Base de Datos:** Un servidor **MySQL** para el almacenamiento persistente de todos los datos de la aplicación.
- **Bot de Scraping:** Un script de **Python** que utiliza **Selenium** para automatizar la extracción de precios desde WhatsApp Web y los envía al backend.

Estos servicios (a excepción del bot) están diseñados para ser ejecutados en contenedores **Docker**, facilitando su despliegue y escalabilidad.

---

## ✨ Características Principales

- Gestión completa de arrendadores, arrendatarios y contratos de arrendamiento.
- Registro y seguimiento de pagos y facturaciones.
- Módulo de configuración para precios, retenciones y ubicaciones.
- Autenticación de usuarios basada en roles (administrador, usuario).
- Automatización de la carga de precios del mercado de AGD a través de un bot.
- Sistema de backups programables para la base de datos.
- Reportes automáticos enviados por correo electrónico.

---

## 🚀 Puesta en Marcha (Setup)

Sigue estos pasos para configurar y desplegar el sistema en un entorno de desarrollo o producción.

### Prerrequisitos

- **Docker:** Es indispensable tener Docker instalado y en ejecución. Se recomienda **Docker Desktop** para Windows o macOS.
- **Docker Compose:** Generalmente viene incluido con Docker Desktop.

### Configuración de Entorno

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/tu_usuario/tu_repositorio.git
    cd tu_repositorio
    ```

2.  **Variables de Entorno del Backend:**
    - Navega al directorio `backend/`.
    - Crea un archivo `.env` basado en el archivo `.env.example` (si existe) o créalo desde cero.
    - **¡MUY IMPORTANTE!** Configura la variable para la **llave de aplicación de Gmail** que se usará para el envío de correos. Esto es crucial para que el sistema de reportes funcione.
      ```env
      # backend/.env
      GMAIL_APP_KEY="tu_llave_de_aplicacion_de_gmail"
      # ... otras variables de configuración
      ```

3.  **Configuración del Host del Frontend:**
    - Para evitar problemas con el DHCP y asegurar una comunicación estable entre el frontend y el backend en una red local, es necesario configurar el nombre del host.
    - Abre el archivo `frontend/next.config.js` y modifica el `hostname` para que coincida con el nombre del equipo donde se ejecuta el backend.
      ```javascript
      // frontend/next.config.js
      const nextConfig = {
        // ...
        images: {
          remotePatterns: [
            {
              protocol: 'http',
              hostname: 'DESKTOP-JUAN.local', // <-- CAMBIAR ESTE VALOR
              port: '8080',
              pathname: '/media/**',
            },
          ],
        },
        // ...
      };
      ```

### Comandos de Docker

Utiliza `docker-compose` desde la raíz del proyecto para gestionar los servicios.

- **Construir y levantar los contenedores en segundo plano:**
  ```bash
  docker-compose up -d --build
  ```
- **Levantar los contenedores (si ya están construidos):**
  ```bash
  docker-compose up
  ```
- **Detener los contenedores:**
  Este comando detiene y elimina los contenedores, pero no los volúmenes de datos. Es el comando que debes usar cuando quieras reconstruir las imágenes con nuevos cambios en el código.
  ```bash
  docker-compose down
  ```
- **Gestionar Volúmenes:**
  Los volúmenes se usan para la persistencia de datos (ej. la base de datos).
  - Listar volúmenes: `docker volume ls`
  - **¡CUIDADO!** Eliminar el volumen de la base de datos (borra todos los datos): `docker volume rm proyectofinal_mysql_data`

---

## 🤖 Configuración del Bot de Precios

El bot está diseñado para ejecutarse directamente en la máquina anfitriona (servidor), ya que requiere interacción con una interfaz gráfica (Chrome) para WhatsApp Web.

1.  **Configurar Contacto:**
    - Abre el archivo `bot/botPrecioAGD.py`.
    - Modifica la variable `CONTACTO` con el nombre exacto que tienes agendado para el contacto de AGD en WhatsApp.
      ```python
      # bot/botPrecioAGD.py
      class BotPrecioAGD:
          CONTACTO = "NombreDelContactoAGD" # <-- CAMBIAR ESTE VALOR
          # ...
      ```

### Creación del Ejecutable

Para facilitar su ejecución y programación, se recomienda compilar el script en un archivo `.exe` usando PyInstaller.

1.  **Crea y activa un entorno virtual para el bot:**
    ```bash
    python -m venv venv_bot_build
    .\venv_bot_build\Scripts\activate
    ```
2.  **Instala las dependencias:**
    ```bash
    pip install -r bot/requirements.txt # (Asegúrate de que exista un requirements.txt para el bot)
    pip install pyinstaller
    ```
3.  **Genera el ejecutable:**
    - Para un ejecutable con consola (útil para depuración):
      ```bash
      pyinstaller --onefile --name WhatsAppBotAGD bot/botPrecioAGD.py
      ```
    - Para un ejecutable sin consola (recomendado para producción):
      ```bash
      pyinstaller --onefile --windowed --name WhatsAppBotAGD bot/botPrecioAGD.py
      ```
    El `.exe` se encontrará en la carpeta `dist/`.

### Programar Tarea en Windows

Para que el bot se ejecute de forma automática y persistente, crea una tarea programada en Windows.

1.  Abre el **Programador de Tareas** de Windows.
2.  En el panel lateral, selecciona **"Crear tarea..."**.
3.  **Pestaña General:**
    - **Nombre:** `BotWhatsappAGD`
    - **Configurar para:** `Windows 10` (o la versión correspondiente).
4.  **Pestaña Desencadenadores:**
    - **Nuevo...**
    - **Iniciar la tarea:** `Al iniciar sesión`.
    - **Usuario específico:** El usuario que se usará en el servidor.
    - **Retrasar durante:** `1 minuto` (recomendado para dar tiempo a que la red se inicie).
5.  **Pestaña Acciones:**
    - **Nueva...**
    - **Acción:** `Iniciar un programa`.
    - **Programa/script:** Haz clic en `Examinar...` y selecciona el archivo `.exe` del bot.
    - **Iniciar en (opcional):** Especifica la ruta al directorio `bot/`. Esto es **IMPORTANTE** para que el bot encuentre archivos relativos como el perfil de Chrome.
6.  **Pestaña Condiciones:**
    - Desmarca la opción `Detener si el equipo cambia a modo de batería`.
    - (Opcional) Puedes configurar la tarea para que solo se inicie si una red específica está disponible.
7.  **Pestaña Configuración:**
    - Marca `Si la tarea no se ejecuta, reiniciarla cada: 10 minutos` y `Número de reintentos: 3`.
    - Desmarca `Detener la tarea si se ejecuta durante más de X días`.

### Visualización de Logs

El bot genera un archivo de log llamado `bot_whatsapp.log` en su directorio. Para ver los logs en tiempo real desde PowerShell:
```powershell
Get-Content -Path "C:\ruta\completa\al\bot\bot_whatsapp.log" -Wait
```

---

## 🌐 Acceso a la Red y Firewall

Para acceder al frontend desde otros dispositivos en la misma red local (ej. un teléfono o laptop), necesitas crear una regla de entrada en el Firewall de Windows en la máquina donde corre el backend.

1.  Abre **"Firewall de Windows Defender con seguridad avanzada"**.
2.  **Reglas de entrada** > **Nueva regla...**
3.  **Tipo de regla:** `Puerto`.
4.  **Protocolo y puertos:** `TCP` y `Puertos locales específicos: 3000` (o el puerto que use tu frontend).
5.  **Acción:** `Permitir la conexión`.
6.  **Perfil:** Desmarca `Público` por seguridad. Deja `Privado` y `Dominio`.
7.  **Nombre:** `Acceso Frontend Next.js (Puerto 3000)`.
8.  Finaliza el asistente.

Ahora podrás acceder usando la URL `http://NOMBRE-DEL-EQUIPO.local:3000`.

---

## 💾 Sistema de Backups

El proyecto incluye un script de PowerShell para realizar backups de la base de datos.

1.  **Configuración del Script:**
    - Edita el script ubicado en `backup/run_backup.ps1` para configurar los destinatarios del correo y las credenciales necesarias.
2.  **Ejecución Manual:**
    - Puedes ejecutar el script directamente desde una terminal de PowerShell.
3.  **Programar Tarea de Backup:**
    - Crea una nueva tarea programada (similar al bot) para ejecutar el script de forma periódica (ej. una vez al mes).
    - En la pestaña **Acciones**, en el campo `Agregar argumentos (opcional)`, añade lo siguiente para que el script se ejecute en segundo plano:
      ```
      -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Ruta\Completa\A\Tu\run_backup.ps1"
      ```