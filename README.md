#  Sistema de Gestión Escolar - Colegio Pablo Neruda
## Descripción General del Proyecto
Este repositorio contiene el código fuente de un Sistema de Gestión Escolar integral diseñado para el Colegio Pablo Neruda. El sistema facilita la administración académica y operativa, permitiendo la interacción entre estudiantes y profesores a través de portales dedicados.

El objetivo principal es optimizar tareas clave como el inicio de sesión de usuarios, la gestión de calificaciones (notas), el registro de asistencia, la visualización de horarios, y la administración de información sobre asignaturas, aulas y docentes.

## Lógica de Negocio y Funcionalidades Clave 
El sistema implementa la siguiente lógica central y funcionalidades:

**Roles de Usuario**

* Estudiante: Accede a su panel para ver sus notas, asistencia, horario, información sobre docentes y asignaturas, y el cuadro de honor.

* Profesor: Accede a su panel para gestionar clases, registrar y modificar notas de estudiantes, tomar asistencia, ver su horario completo y acceder al cuadro de honor.

**Funcionalidades del Sistema**

*Autenticación de Usuarios*:
* Inicio de sesión seguro para estudiantes y profesores utilizando correo electrónico y contraseña.
* Contraseñas encriptadas con Flask-Bcrypt para mayor seguridad.
* Verificación de sesión activa y redirección a la página de inicio de sesión si no hay una sesión activa.

**Gestión de Calificaciones (Notas):**

* Para Profesores: Permite a los profesores registrar, editar y eliminar notas por corte y tipo de nota (trabajos, quices, evaluaciones finales, etc.) para sus clases y estudiantes asignados. Los promedios se calculan dinámicamente.

* Para Estudiantes: Permite a los estudiantes visualizar sus notas detalladas por asignatura y corte, así como su promedio final por asignatura.

**Registro y Consulta de Asistencia:**

* Para Profesores: Facilita el registro de asistencia por clase y fecha.

* Para Estudiantes: Permite a los estudiantes consultar su historial de asistencia por asignatura.

**Visualización de Horarios:**

* Para Profesores: Muestra el horario completo de clases asignadas, incluyendo asignatura, grupo, día, hora de inicio y fin, y aula. Se puede descargar como PDF.

* Para Estudiantes: Muestra el horario de clases asignadas, incluyendo asignatura, docente, día, hora y aula. Se puede descargar como PDF.

**Información General:**

* Para Estudiantes: Acceso a listados de docentes, aulas y asignaturas relacionadas con su grupo.

* Dashboard Personalizado: Paneles de control para estudiantes y profesores con resúmenes rápidos de su información relevante (clases del día, promedio general, etc.).

* Cuadro de Honor: Permite consultar a los 5 estudiantes con los mejores promedios, tanto a nivel general como por corte específico.

* Notificaciones (Para Estudiantes): Los estudiantes reciben notificaciones cuando sus notas son actualizadas por los profesores.

## Tecnologías Utilizadas

**Backend:**

* Python 3
* Flask: Microframework web para la creación de la API y el manejo de rutas.
* Flask-Bcrypt: Para el hashing de contraseñas.
*Psycopg2: Adaptador de PostgreSQL a Python.

**Base de Datos**:

* PostgreSQL: Sistema de gestión de bases de datos relacionales para almacenar toda la información académica.

**Interfaz:**

* HTML5: Estructura de las páginas web.
* CSS3 (Custom & Bootstrap): Estilos personalizados y componentes UI/UX proporcionados por Bootstrap.
* JavaScript: Lógica del lado del cliente para interacciones dinámicas, manejo de datos y visualización.
* Bootstrap 5.3.3: Framework CSS para un diseño responsivo y moderno.
* Bootstrap Icons 1.11.3: Librería de iconos.
* html2pdf.js: Librería para la generación de PDFs del horario directamente desde el navegador.

**Gestión de Dependencias (Backend):**

* requirements.txt(implícito para Flask y sus extensiones)

## Prerrequisitos  

Antes de ejecutar el proyecto, asegúrate de tener instalado lo siguiente:

* Python 3.x
* pip (gestor de paquetes de Python)
* PostgreSQL
* Un navegador web moderno (Chrome, Firefox, Edge, etc.)

## Configuración y Ejecución
**1. Base de Datos**
1. Asegúrate de tener PostgreSQL instalado y ejecutándose en tu sistema.
2. Crea una base de datos con el nombre `colegio_pablo_neruda`.
3. Configura las credenciales de la base de datos:
* En ``proColegio/app.py``, verifica la función ``get_db_connection()``.
* Asegúrate de que ``user`` y ``password`` coincidan con tus credenciales de PostgreSQL.
* El ``host`` y ``port`` por defecto son ``localhost`` y ``5432`` respectivamente.
* Para la inicialización de la base de datos desde ``backend/init_db.py``, también ajusta las credenciales en la sección ``if __name__ == "__main__":``.
4. Inicializa la base de datos y carga datos de ejemplo:
* Navega a la carpeta ``backend/``.
* Ejecuta el script ``init_db.py`` para crear las tablas y poblar la base de datos con datos de prueba:

  ```
    python init_db.py
    ```
Este script borrará las tablas existentes y las recreará, insertando datos de ejemplo para grupos, estudiantes, aulas, profesores, asignaturas, horarios, notas, asistencia y asesorías.

**2. Instalación de Dependencias del Backend**
1. Navega a la carpeta principal de la aplicación Flask: ``proColegio``/.
2. Instala las dependencias de Python:

  ```
 pip install Flask psycopg2-binary Flask-Bcrypt
```

**3. Ejecución del Backend (Aplicación Flask)**
1. Desde la carpeta ``proColegio/``, ejecuta la aplicación Flask:
 
 ```
 python app.py
```
2. El backend se iniciará, por defecto, en ``http://localhost:5000``.

**4. Acceso al Frontend**

Una vez que el backend esté corriendo, puedes acceder a la interfaz de usuario abriendo tu navegador web y navegando a:

* Página de Inicio de Sesión: ``http://localhost:5000/``
* Panel de Estudiantes: ``http://localhost:5000/inicio`` (se requiere iniciar sesión)
* Panel de Profesores: ``http://localhost:5000/profesor``(se requiere iniciar sesión)

  ## Estructura del Proyecto

 ```
colegio-pablo-neruda/
├── backend/                                # Scripts para la base de datos
│   ├── init_db.py                          # Script para inicializar y poblar la DB
│   └── colegio_pablo_neruda.sql            # Definición del esquema SQL (referencia)
└── proColegio/                             # Aplicación principal de Flask
    ├── app.py                              # Rutas de la API y renderizado de templates
    ├── static/                             # Archivos estáticos (CSS, JS, imágenes)
    │   ├── css/
    │   │   └── styles.css                  # Estilos personalizados
    │   ├── img/
    │   │   └── logo.jpeg                   # Logo del colegio
    │   ├── js/
    │   │   ├── conexion.js                 # (No usado directamente por Flask, posible remanente)
    │   │   ├── profesor_asistencia.js      # Lógica JS para gestión de asistencia del profesor
    │   │   ├── profesor_auth.js            # Lógica JS para autenticación (cerrar sesión) del profesor
    │   │   ├── profesor_clases.js          # Lógica JS para visualización de clases del profesor
    │   │   ├── profesor_horario.js         # Lógica JS para visualización de horario del profesor
    │   │   ├── profesor_info.js            # Lógica JS para información general del profesor (no usada en main)
    │   │   ├── profesor_main.js            # Lógica principal JS para el panel del profesor
    │   │   ├── profesor_notas.js           # Lógica JS para gestión de notas del profesor
    │   │   └── servidor.js                 # (No usado directamente por Flask, posible remanente/ejemplo de Node.js)
    └── templates/                          # Archivos HTML (vistas)
        ├── index.html                      # Página de inicio de sesión
        ├── inicio.html                     # Panel del estudiante
        └── profesor.html                   # Panel del profesor       
  ```
## Autores
El proyecto está siendo desarrollado por estudiantes de la Universidad de Pamplona, Facultad de Ingenierías y Arquitectura, Programa Ingeniería de Sistemas, para la asignatura Desarrollo Orientado a Plataformas (2025):

* Einer Arlex Alvear Jaimes
* Juan Sebastian Cárdenas Acevedo
* Manuel Sebastian Carvajal Prieto

## Docente
* FANNY CASADIEGO CHIQUILLO

## Colaboradores Extra
* Brian acevedo
  
