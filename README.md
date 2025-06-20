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
