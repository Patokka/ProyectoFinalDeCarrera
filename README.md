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
Acordate de poner la llave de gmail del correode la organización, en .env del backend , para que ellos sean los que envian los reportes.
Configurá la ip privada del servidor en next.config y env.local.

**Tips**
Algunos comandos que te pueden servir (todo en /ProyectoFinal):
- docker-compose up -d --build para levantar las imagenes.
- docker-compose up para arrancar los contenedores.
- docker-compose down para finalizar contenedores, después de este si o sí tenés que hacer un build de nuevo (generalmente usas este para cambiar código y rebuildear).
- docker volume ls lista los volumenes o persistencias, de acá te interesa el del bot o  la base de datos.
- docker volume rm proyectofinal_mysql_data para eliminar los datos de la base de datos (OJO CON ESTO).