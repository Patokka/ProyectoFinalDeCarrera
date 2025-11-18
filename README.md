# Sistema de Gestión de Arrendamientos Rurales

Este proyecto implementa un sistema completo para la gestión de arrendamientos rurales, incluyendo backend (FastAPI), frontend (Next.js), base de datos (MySQL) y un bot de scraping (Python + Selenium), todo orquestado con Docker Compose.

---

## Prerrequisitos

* **Docker:** Asegúrate de tener Docker instalado y corriendo. Mejor si se descarga docke desktop.
* **Docker Compose:** Usualmente viene incluido con Docker Desktop.

---

## Configuración

Antes de levantar los contenedores, necesitas configurar algunas variables de entorno y preparar los datos iniciales.

**Contenido mínimo requerido:**
Acordate de poner la llave de gmail del correo de la organización, en .env del backend , para que ellos sean los que envian los reportes!!!!!!!!!.
Cambiar el nombre de contacto de Fran al que tienen agendado a AGD!!!!!!!!!.
El bot se ejecutará directamente en el servidor ya que no puede ser dockerizado, hay que crear la tarea o el proceso y mandarle la ruta completa al ejecutable, este genera el exe, ejecutar en entorno (.\venv_bot_build\Scripts\activate) con requirements:
    - pyinstaller --onefile --name WhatsAppBotAGD botPrecioAGD.py es el comando
    - pyinstaller --onefile --windowed --name WhatsAppBotAGD botPrecioAGD.py para que al ejecutar no tenga consola.

**Tips**
Algunos comandos que te pueden servir (todo en /ProyectoFinal):
- docker-compose up -d --build para levantar las imagenes.
- docker-compose up para arrancar los contenedores.
- docker-compose down para finalizar contenedores, después de este si o sí tenés que hacer un build de nuevo (generalmente usas este para cambiar código y rebuildear).
- docker volume ls lista los volumenes o persistencias, de acá te interesa el del bot o  la base de datos.
- docker volume rm proyectofinal_mysql_data para eliminar los datos de la base de datos (OJO CON ESTO).

**Configurar Tarea programada bot**
Windows y buscar programador de tareas.
Panel lateral -> Crear tarea (no tarea básica).
    *Pestaña General*
Nombre: BotWhatsappAGD
Configurar para: Windows 10
    *Desencadenadores*
Nuevo
Iniciar la tarea: Al iniciar sesión
Usuario Específico -> El que se use en el pc
Retrasar durante: 1 minuto, para que le de tiempo a la conexión si hace falta
    *Acciones*
Iniciar un progarma
Browse la ubicación del .exe
IMPORTANTE: iniciar en -> /bot
    *Condiciones*
Desmarcar Detener si el equipo comienza a usar batería (aunque sea de escritorio)
(Opcional) Iniciar solo si la siguiente red está disponible -> red oficina, creo que está bueno porque si es otra red que no es la del backend no va a andar
    *Configuración (si te deja hacerla sin poner contraseña)*
Marcar: Si la tarea no se ejecuta, reiniciarla cada: 10 minutos -> máximo: 3 veces
Destildar si la tarea se ejecuta por más de x días seguidos detenerla

Get-Content -Path "C:\ruta\tu_archivo.txt" -Wait, ubicate en ruta de log y pone el nombre, para ver logs en tiempo real 

**Backup**
Tenés que ejecutar el script que está en /backup con powershell, y si queres programar una tarea para que la realice una vez por mes, ver archivo para cambiar llaves y destinatarios.
-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Ruta\Completa\A\Tu\run_backup.ps1" editando eso en la pestaña de acciones de la tarea, en donde dice agregar argumentos poner esa línea para que ejecute en modo hidden. Iniciar en puede quedar en vacío en esta pestaña


**Para manejo de ip**
Tenés que cambiar el nombre de dispositivo en next.config.js para no preocuparte del dhcp y se pueda comunicar bien con el docker

Agregar una "Regla de entrada" en el firewall de la PC backend.
En la PC con Windows 11, presiona la tecla Windows y escribe "Firewall".
Abre "Firewall de Windows Defender con seguridad avanzada".
En el panel izquierdo, haz clic en "Reglas de entrada".
En el panel derecho, haz clic en "Nueva regla...".
Se abrirá un asistente:
Tipo de regla: Selecciona Puerto. Haz clic en Siguiente.
Protocolo y puertos: Selecciona TCP. Abajo, selecciona Puertos locales específicos: y escribe el puerto de tu frontend (ej: 3000). Haz clic en Siguiente.
Acción: Selecciona Permitir la conexión. Haz clic en Siguiente.
Perfil: Desmarca "Público" (por seguridad). Deja marcadas Privado y Dominio. Haz clic en Siguiente.
Nombre: Escribe un nombre descriptivo, como Acceso Frontend Next.js (Puerto 3000).
Haz clic en Finalizar.
Una vez que hagas esto, la regla se aplica de inmediato. Intenta acceder desde tu teléfono o laptop otra vez usando http://DESKTOP-JUAN.local:3000 y ahora sí debería funcionar.