import psycopg2
from flask_bcrypt import Bcrypt
from datetime import datetime, time, date
import random
from datetime import timedelta

def init_db(conn):
    bcrypt = Bcrypt()

    with conn.cursor() as cur:
        # Borrar tablas si existen (orden inverso para evitar problemas de FK)
        cur.execute("DROP TABLE IF EXISTS Asistencia CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Horarios CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Notas CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Asesorias CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Estudiantes CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Grupos CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Asignaturas CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Profesores CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Aulas CASCADE;")


        # Crear tablas (ensure these match your .sql schema)
        cur.execute("""
        CREATE TABLE Grupos (
            Grupo_ID INTEGER PRIMARY KEY,
            NombreGrupo VARCHAR(50) NOT NULL,
            NivelGrupo VARCHAR(50),
            CapacidadGrupo INTEGER,
            CONSTRAINT chk_CapacidadGrupo CHECK (CapacidadGrupo >= 10 AND CapacidadGrupo <= 15)
        );
        """)
        cur.execute("""
        CREATE TABLE Estudiantes (
            Estudiante_ID SERIAL PRIMARY KEY,
            NombreEstudiante VARCHAR(255) NOT NULL,
            ApellidoEstudiante VARCHAR(255) NOT NULL,
            EmailEstudiante VARCHAR(100) UNIQUE,
            FechaNacimiento DATE,
            Grupo_ID INTEGER REFERENCES Grupos(Grupo_ID),
            Contrasena VARCHAR(100)
        );
        """)
        cur.execute("""
        CREATE TABLE Aulas (
            Aula_ID SERIAL PRIMARY KEY,
            NombreAula VARCHAR(50) NOT NULL,
            Capacidad INTEGER,
            TipoAula VARCHAR(50),
            Ubicacion VARCHAR(100)
        );
        """)
        cur.execute("""
        CREATE TABLE Profesores (
            Profesor_ID SERIAL PRIMARY KEY,
            NombreProfesor VARCHAR(255) NOT NULL,
            ApellidoProfesor VARCHAR(255) NOT NULL,
            EmailProfesor VARCHAR(100) UNIQUE,
            TelefonoProfesor VARCHAR(20),
            Disponibilidad VARCHAR(255),
            Contrasena VARCHAR(100)
        );
        """)
        cur.execute("""
        CREATE TABLE Asignaturas (
            Asignatura_ID SERIAL PRIMARY KEY,
            NombreAsignatura VARCHAR(100) NOT NULL,
            DescripcionAsignatura VARCHAR(255),
            Creditos INTEGER,
            DuracionClase INTEGER,
            CONSTRAINT chk_DuracionClase CHECK (DuracionClase >= 120 AND DuracionClase <= 240)
        );
        """)
        cur.execute("""
        CREATE TABLE Horarios (
            Horario_ID SERIAL PRIMARY KEY,
            Asignatura_ID INTEGER REFERENCES Asignaturas(Asignatura_ID),
            Profesor_ID INTEGER REFERENCES Profesores(Profesor_ID),
            Aula_ID INTEGER REFERENCES Aulas(Aula_ID),
            Grupo_ID INTEGER REFERENCES Grupos(Grupo_ID),
            DiaSemana VARCHAR(20),
            HoraInicio TIMESTAMP,
            HoraFin TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE Notas (
            nota_id SERIAL PRIMARY KEY,
            estudiante_id INTEGER REFERENCES Estudiantes(Estudiante_ID),
            asignatura_id INTEGER REFERENCES Asignaturas(Asignatura_ID),
            profesor_id INTEGER REFERENCES Profesores(Profesor_ID),
            corte INTEGER NOT NULL,
            tipo_nota VARCHAR(50) NOT NULL,
            nombrecolumnaextra VARCHAR(100),
            nota NUMERIC(4, 2) NOT NULL CHECK (nota >= 0 AND nota <= 5),
            UNIQUE (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota)
        );
        """)
        cur.execute("""
        CREATE TABLE Asistencia (
            Asistencia_ID SERIAL PRIMARY KEY,
            Estudiante_ID INTEGER REFERENCES Estudiantes(Estudiante_ID),
            Asignatura_ID INTEGER REFERENCES Asignaturas(Asignatura_ID),
            Fecha DATE NOT NULL,
            Presente BOOLEAN NOT NULL,
            UNIQUE (Estudiante_ID, Asignatura_ID, Fecha)
        );
        """)
        cur.execute("""
        CREATE TABLE Asesorias (
            Asesoria_ID SERIAL PRIMARY KEY,
            Profesor_ID INTEGER REFERENCES Profesores(Profesor_ID),
            Titulo VARCHAR(100) NOT NULL,
            Descripcion TEXT,
            Fecha DATE NOT NULL,
            HoraInicio TIME NOT NULL,
            HoraFin TIME NOT NULL,
            Aula_ID INTEGER REFERENCES Aulas(Aula_ID),
            Capacidad INTEGER,
            CONSTRAINT chk_HoraAsesoria CHECK (HoraFin > HoraInicio)
        );
        """)


        # Insertar datos en Grupos
        grupos_data = [
            (1, 'AR', 'Nivel I', 12),
            (2, 'BR', 'Nivel II', 15),
            (3, 'CR', 'Nivel III', 10),
            (4, 'DR', 'Nivel I', 14),
            (5, 'ER', 'Nivel II', 13),
            (6, 'FR', 'Nivel III', 11)
        ]
        cur.executemany("INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES (%s, %s, %s, %s);", grupos_data)


        # Insertar datos en Aulas
        aulas_data = [
            (1, 'GM 104-2', 30, 'Normal', 'Primer Piso'),
            (2, 'GM 104-1', 30, 'Normal', 'Primer Piso'),
            (3, 'GM 209-1', 25, 'Laboratorio', 'Segundo Piso'),
            (4, 'GM 209-2', 25, 'Laboratorio', 'Segundo Piso'),
            (5, 'Auditorio Principal', 100, 'Auditorio', 'Tercer Piso'),
            (6, 'Sala de Arte', 15, 'Especial', 'Segundo Piso'),
            (7, 'Laboratorio de Física', 20, 'Laboratorio', 'Tercer Piso'),
            (8, 'Sala de Música', 20, 'Especial', 'Primer Piso')
        ]
        cur.executemany("INSERT INTO Aulas (Aula_ID, NombreAula, Capacidad, TipoAula, Ubicacion) VALUES (%s, %s, %s, %s, %s);", aulas_data)
        cur.execute("SELECT setval('aulas_aula_id_seq', (SELECT MAX(Aula_ID) FROM Aulas));")


        # Insertar datos en Asignaturas
        asignaturas_data = [
            (1, 'Base de Datos', 'Fundamentos de bases de datos relacionales', 4, 180),
            (2, 'Logica de Programación', 'Principios de lógica matemática y programación', 3, 120),
            (3, 'Metodología de Investigación', 'Metodología de la investigación científica', 2, 240),
            (4, 'Desarrollo de Plataformas Web', 'Desarrollo de aplicaciones web dinámicas', 4, 150),
            (5, 'Álgebra Lineal', 'Estudio de vectores, matrices y sistemas de ecuaciones', 3, 180),
            (6, 'Química General', 'Principios fundamentales de la química', 3, 120),
            (7, 'Literatura Universal', 'Análisis de obras literarias clásicas', 2, 240),
            (8, 'Cálculo Diferencial', 'Introducción al cálculo de una variable', 4, 180)
        ]
        cur.executemany("INSERT INTO Asignaturas (Asignatura_ID, NombreAsignatura, DescripcionAsignatura, Creditos, DuracionClase) VALUES (%s, %s, %s, %s, %s);", asignaturas_data)
        cur.execute("SELECT setval('asignaturas_asignatura_id_seq', (SELECT MAX(Asignatura_ID) FROM Asignaturas));")


        # Insertar datos en Profesores
        profesores_data = [
            (1, 'Harvey', 'Gamboa', 'harvey.gamboa@email.com', '123-456-7890', 'Lunes y Miércoles 14:00-16:00', 'harvey123'),
            (2, 'Jesus', 'Duran', 'jesus.duran@email.com', '987-654-3210', 'Martes y Jueves 12:00-16:00', 'jesus123'),
            (3, 'Eduardo', 'Rueda', 'eduardo.rueda@email.com', '555-123-4567', 'Viernes 09:00-11:00', 'eduardo123'),
            (4, 'Fanny', 'Casadiego', 'fanny.casadiego@email.com', '111-222-3333', 'Miércoles 10:00-12:00', 'fanny123'),
            (5, 'Ana', 'Martinez', 'ana.martinez@email.com', '321-654-9870', 'Lunes 10:00-12:00', 'ana123'),
            (6, 'Luis', 'Perez', 'luis.perez@email.com', '444-555-6666', 'Jueves 09:00-11:00', 'luis123'),
            (7, 'Sofia', 'Vargas', 'sofia.vargas@email.com', '777-888-9999', 'Martes y Jueves 15:00-17:00', 'sofia123')
        ]
        processed_profesores = []
        for id_prof, nombre, apellido, email, telefono, disponibilidad, contrasena in profesores_data:
            hashed_password = bcrypt.generate_password_hash(contrasena.encode('utf-8')).decode('utf-8')
            processed_profesores.append((id_prof, nombre, apellido, email, telefono, disponibilidad, hashed_password))
        cur.executemany("INSERT INTO Profesores (Profesor_ID, NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad, Contrasena) VALUES (%s, %s, %s, %s, %s, %s, %s);", processed_profesores)
        cur.execute("SELECT setval('profesores_profesor_id_seq', (SELECT MAX(Profesor_ID) FROM Profesores));")


        # Insertar datos en Estudiantes
        estudiantes_data = [
            (1, 'Kevin', 'Marquez', 'kevin.marquez@email.com', '2003-05-10', 1, 'kevin123'),
            (2, 'Sebastian', 'Rolon', 'sebastian.rolon@email.com', '2004-11-22', 2, 'sebastian123'),
            (3, 'Julio', 'Carrillo', 'julio.carrillo@email.com', '2002-08-15', 3, 'julio123'),
            (4, 'Geron', 'Vergara', 'geron.vergara@email.com', '2003-02-28', 3, 'geron123'),
            (5, 'Brian', 'Acevedo', 'brian.acevedo@email.com', '2005-01-05', 1, 'brian123'),
            (6, 'Einer', 'Alvear', 'einer.alvear@email.com', '2002-12-19', 2, 'einer123'),
            (7, 'Brayan', 'Amado', 'brayan.amado@email.com', '2004-06-30', 1, 'brayan123'),
            (8, 'Andres', 'Vera', 'andres.vera@email.com', '2003-09-08', 2, 'andres123'),
            (9, 'Julian', 'Pulido', 'julian.pulido@email.com', '2002-04-01', 1, 'julian123'),
            (10, 'Juan', 'Ochoa', 'juan.ochoa@email.com', '2004-03-12', 3, 'juan123'),
            (11, 'Jerley', 'Hernandez', 'jerley.hernandez@email.com', '2003-07-26', 3, 'jerley123'),
            (12, 'Laura', 'Garcia', 'laura.garcia@email.com', '2003-11-01', 4, 'laura123'),
            (13, 'David', 'Rodriguez', 'david.rodriguez@email.com', '2004-02-14', 4, 'david123'),
            (14, 'Sofia', 'Diaz', 'sofia.diaz@email.com', '2005-04-25', 5, 'sofia123'),
            (15, 'Mateo', 'Sanchez', 'mateo.sanchez@email.com', '2003-08-08', 5, 'mateo123'),
            (16, 'Valentina', 'Torres', 'valentina.torres@email.com', '2004-10-17', 4, 'valentina123'),
            (17, 'Pablo', 'Gomez', 'pablo.gomez@email.com', '2003-03-03', 6, 'pablo123'),
            (18, 'Daniela', 'Ruiz', 'daniela.ruiz@email.com', '2004-01-20', 6, 'daniela123')
        ]
        processed_estudiantes = []
        for id_est, nombre, apellido, email, fecha_nacimiento, grupo_id, contrasena in estudiantes_data:
            hashed_password = bcrypt.generate_password_hash(contrasena.encode('utf-8')).decode('utf-8')
            processed_estudiantes.append((id_est, nombre, apellido, email, fecha_nacimiento, grupo_id, hashed_password))
        cur.executemany("INSERT INTO Estudiantes (Estudiante_ID, NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES (%s, %s, %s, %s, %s, %s, %s);", processed_estudiantes)
        cur.execute("SELECT setval('estudiantes_estudiante_id_seq', (SELECT MAX(Estudiante_ID) FROM Estudiantes));")


        # Insertar datos en Horarios (Ensuring professors have at least 3 groups and fixing conflict)
        horarios_data = [
            # Prof. Harvey Gamboa (ID 1) - Targets groups 1, 2, 3 (min 3)
            (1, 1, 1, 1, 'Lunes', datetime(2025, 1, 1, 8, 0), datetime(2025, 1, 1, 10, 0)), # Base de Datos, Grupo AR
            (1, 1, 1, 1, 'Miércoles', datetime(2025, 1, 1, 8, 0), datetime(2025, 1, 1, 10, 0)),
            (1, 1, 2, 2, 'Lunes', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 12, 0)), # Base de Datos, Grupo BR
            (1, 1, 2, 3, 'Jueves', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 12, 0)), # Base de Datos, Grupo CR

            # Prof. Jesus Duran (ID 2) - Targets groups 1, 2, 4 (min 3)
            (2, 2, 3, 2, 'Martes', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 12, 0)), # Logica, Grupo BR
            (2, 2, 3, 2, 'Jueves', datetime(2025, 1, 1, 17, 30), datetime(2025, 1, 1, 19, 30)), # Logica, Grupo BR -- CONFLICT RESOLVED: Changed from 05:00 to 17:30 (5:30 PM) to avoid overlap with Fanny's class
            (2, 2, 4, 1, 'Miércoles', datetime(2025, 1, 1, 16, 0), datetime(2025, 1, 1, 18, 0)), # Logica, Grupo AR
            (2, 2, 4, 4, 'Viernes', datetime(2025, 1, 1, 16, 0), datetime(2025, 1, 1, 18, 0)), # Logica, Grupo DR (Today: Friday, June 13, 2025)

            # Prof. Eduardo Rueda (ID 3) - Targets groups 3, 5, 6 (min 3)
            (3, 3, 5, 3, 'Lunes', datetime(2025, 1, 1, 14, 0), datetime(2025, 1, 1, 17, 0)), # Metodología, Grupo CR
            (3, 3, 5, 5, 'Miércoles', datetime(2025, 1, 1, 14, 0), datetime(2025, 1, 1, 17, 0)), # Metodología, Grupo ER
            (7, 3, 8, 6, 'Martes', datetime(2025, 1, 1, 9, 0), datetime(2025, 1, 1, 13, 0)), # Literatura Universal, Grupo FR

            # Prof. Fanny Casadiego (ID 4) - Targets groups 1, 2, 4 (min 3)
            (4, 4, 6, 1, 'Martes', datetime(2025, 1, 1, 8, 0), datetime(2025, 1, 1, 10, 30)), # Desarrollo Web, Grupo AR
            (4, 4, 6, 2, 'Jueves', datetime(2025, 1, 1, 15, 0), datetime(2025, 1, 1, 17, 30)), # Desarrollo Web, Grupo BR (This one was 03:00-05:30, fixed to 15:00-17:30)
            (4, 4, 7, 4, 'Lunes', datetime(2025, 1, 1, 11, 0), datetime(2025, 1, 1, 13, 30)), # Desarrollo Web, Grupo DR

            # Prof. Ana Martinez (ID 5) - Targets groups 3, 5, 6 (min 3)
            (5, 5, 1, 3, 'Lunes', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 13, 0)), # Álgebra Lineal, Grupo CR
            (5, 5, 2, 5, 'Miércoles', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 13, 0)), # Álgebra Lineal, Grupo ER
            (5, 5, 3, 6, 'Viernes', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 13, 0)), # Álgebra Lineal, Grupo FR (Today: Friday, June 13, 2025)

            # Prof. Luis Perez (ID 6) - Targets groups 1, 2, 4 (min 3)
            (6, 6, 4, 1, 'Miércoles', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 12, 0)), # Química General, Grupo AR
            (6, 6, 5, 2, 'Viernes', datetime(2025, 1, 1, 10, 0), datetime(2025, 1, 1, 12, 0)), # Química General, Grupo BR (Today: Friday, June 13, 2025)
            (6, 6, 6, 4, 'Martes', datetime(2025, 1, 1, 14, 0), datetime(2025, 1, 1, 16, 0)), # Química General, Grupo DR
            
            # Prof. Sofia Vargas (ID 7) - Targets groups 1, 3, 5 (min 3)
            (8, 7, 7, 1, 'Lunes', datetime(2025, 1, 1, 15, 0), datetime(2025, 1, 1, 17, 0)), # Cálculo Diferencial, Grupo AR
            (8, 7, 7, 3, 'Miércoles', datetime(2025, 1, 1, 15, 0), datetime(2025, 1, 1, 17, 0)), # Cálculo Diferencial, Grupo CR
            (8, 7, 8, 5, 'Jueves', datetime(2025, 1, 1, 15, 0), datetime(2025, 1, 1, 17, 0)) # Cálculo Diferencial, Grupo ER
        ]
        cur.executemany("INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES (%s, %s, %s, %s, %s, %s, %s);", horarios_data)
        cur.execute("SELECT setval('horarios_horario_id_seq', (SELECT MAX(Horario_ID) FROM Horarios));")

        # Get professor and student IDs for generating notes/attendance
        cur.execute("SELECT Profesor_ID, EmailProfesor FROM Profesores;")
        professors_lookup = {row[1]: row[0] for row in cur.fetchall()} # {email: id}

        cur.execute("SELECT Estudiante_ID, Grupo_ID FROM Estudiantes;")
        students_lookup = {row[0]: row[1] for row in cur.fetchall()} # {estudiante_id: grupo_id}


        # Helper to generate a random grade
        def generate_grade():
            return round(random.uniform(2.5, 5.0), 1)

        # Insertar datos de Notas (more varied, include custom types)
        notas_data = []
        # Get all distinct (prof_id, asignatura_id, grupo_id) combinations from Horarios
        cur.execute("SELECT DISTINCT Profesor_ID, Asignatura_ID, Grupo_ID FROM Horarios;")
        all_prof_class_groups = cur.fetchall()

        for prof_id, asignatura_id, grupo_id in all_prof_class_groups:
            # Get students in this group
            students_in_group = [s_id for s_id, s_grupo_id in students_lookup.items() if s_grupo_id == grupo_id]

            for student_id in students_in_group:
                # Generate some random notes for Corte 1 and Corte 2
                for corte in [1, 2]:
                    if random.random() < 0.8: # 80% chance to have 'trabajos'
                        notas_data.append((student_id, asignatura_id, prof_id, corte, 'trabajos', 'Trabajos', generate_grade()))
                    if random.random() < 0.7: # 70% chance to have 'quices'
                        notas_data.append((student_id, asignatura_id, prof_id, corte, 'quices', 'Quices', generate_grade()))
                    if random.random() < 0.6: # 60% chance to have 'participacion'
                        notas_data.append((student_id, asignatura_id, prof_id, corte, 'participacion', 'Participación', generate_grade()))
                    if random.random() < 0.3: # 30% chance for an 'examenparcial'
                        notas_data.append((student_id, asignatura_id, prof_id, corte, f'examenparcialc{corte}', f'Examen Parcial Corte {corte}', generate_grade()))
                
                # Some students might have an 'evaluacionfinal' for Corte 3
                if random.random() < 0.4:
                    notas_data.append((student_id, asignatura_id, prof_id, 3, 'evaluacionfinal', 'Evaluación Final', generate_grade()))

        cur.executemany("INSERT INTO Notas (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nombrecolumnaextra, nota) VALUES (%s, %s, %s, %s, %s, %s, %s);", notas_data)
        cur.execute("SELECT setval('notas_nota_id_seq', (SELECT MAX(nota_id) FROM Notas));")


        # Insertar datos de Asistencia (more varied entries for recent dates)
        today = date.today()
        # Mapping for weekday names
        days_of_week_map = {
            0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
        }

        asistencia_data = []

        # Generate attendance for the last 5 school days for some classes
        for days_ago in range(0, 5): 
            current_date = today - timedelta(days=days_ago)
            current_weekday_name = days_of_week_map[current_date.weekday()]

            # Only generate for Mon-Fri
            if current_date.weekday() in [5, 6]: 
                continue

            # Iterate through all classes scheduled for this weekday
            cur.execute("""
                SELECT DISTINCT h.asignatura_id, h.grupo_id, h.profesor_id
                FROM Horarios h WHERE h.DiaSemana = %s;
            """, (current_weekday_name,))

            classes_on_this_day = cur.fetchall()

            for asignatura_id, grupo_id, prof_id_for_class in classes_on_this_day:
                students_in_group = [s_id for s_id, s_grupo_id in students_lookup.items() if s_grupo_id == grupo_id]
                
                for student_id in students_in_group:
                    is_present = random.random() > 0.1 # 90% chance of being present
                    asistencia_data.append((student_id, asignatura_id, current_date, is_present))
        
        cur.executemany("INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente) VALUES (%s, %s, %s, %s);", asistencia_data)
        cur.execute("SELECT setval('asistencia_asistencia_id_seq', (SELECT MAX(Asistencia_ID) FROM Asistencia));")


        # Insertar datos de Asesorias (more varied entries)
        asesorias_data = [
            (1, 'Asesoría de Lógica Avanzada', 'Repaso de conceptos de lógica proposicional y predicados.', date(2025, 6, 17), time(10, 0, 0), time(11, 0, 0), 1, 5),
            (2, 'Ayuda con Optimización SQL', 'Sesión de preguntas y respuestas sobre consultas SQL avanzadas.', date(2025, 6, 19), time(15, 0, 0), time(16, 30, 0), 2, 8),
            (5, 'Revisión de Proyectos de Álgebra', 'Revisión individual de avances de proyectos de Álgebra Lineal.', date(2025, 6, 20), time(9, 30, 0), time(11, 0, 0), 5, 3),
            (3, 'Taller de Redacción Científica', 'Consejos para la escritura de artículos de investigación y tesis.', date(2025, 6, 25), time(14, 0, 0), time(16, 0, 0), 3, 10),
            (4, 'Debugging en Desarrollo Web', 'Sesión práctica para identificar y corregir errores en aplicaciones web.', date(2025, 6, 16), time(11, 0, 0), time(12, 30, 0), 4, 7),
            (6, 'Conceptos Básicos de Química', 'Refuerzo en conceptos clave de química general.', date(2025, 6, 24), time(8, 0, 0), time(9, 30, 0), 6, 12),
            (7, 'Sesión de Ejercicios de Cálculo', 'Resolución de problemas complejos de cálculo diferencial.', date(2025, 6, 23), time(16, 0, 0), time(17, 30, 0), 7, 6)
        ]
        cur.executemany("INSERT INTO Asesorias (Profesor_ID, Titulo, Descripcion, Fecha, HoraInicio, HoraFin, Aula_ID, Capacidad) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);", asesorias_data)
        cur.execute("SELECT setval('asesorias_asesoria_id_seq', (SELECT MAX(Asesoria_ID) FROM Asesorias));")


    conn.commit()

if __name__ == "__main__":
    conn = psycopg2.connect(
        dbname="colegio_pablo_neruda",
        user="postgres",         # Cambia por tu usuario de PostgreSQL
        password="1234",         # Cambia por tu contraseña de PostgreSQL
        host="localhost",
        port=5432
    )
    init_db(conn)
    print("Base de datos inicializada correctamente con datos extendidos y corregidos.")
    conn.close()