import psycopg2

def init_db(conn):
    with conn.cursor() as cur:
        # Borrar tablas si existen
        cur.execute("DROP TABLE IF EXISTS Horarios CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Estudiantes CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Grupos CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Asignaturas CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Profesores CASCADE;")
        cur.execute("DROP TABLE IF EXISTS Aulas CASCADE;")

        # Crear tablas
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

        # Insertar datos en Grupos
        cur.execute("INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES (1, 'AR', 'Nivel I', 12);")
        cur.execute("INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES (2, 'BR', 'Nivel II', 15);")
        cur.execute("INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES (3, 'CR', 'Nivel III', 10);")

        # Insertar datos en Estudiantes
        estudiantes = [
            ('Kevin', 'Marquez', 'kevin.marquez@email.com', '2003-05-10', 1, 'kevin123'),
            ('Sebastian', 'Rolon', 'sebastian.rolon@email.com', '2004-11-22', 2, 'sebastian123'),
            ('Julio', 'Carrillo', 'julio.carrillo@email.com', '2002-08-15', 3, 'julio123'),
            ('Geron', 'Vergara', 'geron.vergara@email.com', '2003-02-28', 3, 'geron123'),
            ('Brian', 'Acevedo', 'brian.acevedo@email.com', '2005-01-05', 1, 'brian123'),
            ('Einer', 'Alvear', 'einer.alvear@email.com', '2002-12-19', 2, 'einer123'),
            ('Brayan', 'Amado', 'brayan.amado@email.com', '2004-06-30', 1, 'brayan123'),
            ('Andres', 'Vera', 'andres.vera@email.com', '2003-09-08', 2, 'andres123'),
            ('Julian', 'Pulido', 'julian.pulido@email.com', '2002-04-01', 1, 'julian123'),
            ('Juan', 'Ochoa', 'juan.ochoa@email.com', '2004-03-12', 3, 'juan123'),
            ('Jerley', 'Hernandez', 'jerley.hernandez@email.com', '2003-07-26', 3, 'jerley123')
        ]
        cur.executemany(
            "INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES (%s, %s, %s, %s, %s, %s);",
            estudiantes
        )

        # Insertar datos en Aulas
        aulas = [
            ('GM 104-2', 30, 'Normal', 'Primer Piso'),
            ('GM 104-1', 30, 'Normal', 'Primer Piso'),
            ('GM 209-1', 25, 'Laboratorio', 'Segundo Piso'),
            ('GM 209-2', 25, 'Laboratorio', 'Segundo Piso')
        ]
        cur.executemany(
            "INSERT INTO Aulas (NombreAula, Capacidad, TipoAula, Ubicacion) VALUES (%s, %s, %s, %s);",
            aulas
        )

        # Insertar datos en Asignaturas
        asignaturas = [
            ('Base de Datos', 'Fundamentos de bases de datos relacionales', 4, 180),
            ('Logica', 'Principios de lógica matemática y programación', 3, 120),
            ('Investigacion', 'Metodología de la investigación', 2, 240),
            ('Desarrollo de Plataformas', 'Desarrollo de aplicaciones web', 4, 150)
        ]
        cur.executemany(
            "INSERT INTO Asignaturas (NombreAsignatura, DescripcionAsignatura, Creditos, DuracionClase) VALUES (%s, %s, %s, %s);",
            asignaturas
        )

        # Insertar datos en Profesores
        profesores = [
            ('Harvey', 'Gamboa', 'harvey.gamboa@email.com', '123-456-7890', '4:00 pm a 6:00 pm', 'harvey123'),
            ('Jesus', 'Duran', 'jesus.duran@email.com', '987-654-3210', '12:00 pm a 4:00 pm', 'jesus123'),
            ('Eduardo', 'Rueda', 'eduardo.rueda@email.com', '555-123-4567', '9:00 am a 11:00 am', 'eduardo123'),
            ('Fanny', 'Casadiego', 'fanny.casadiego@email.com', '111-222-3333', '2:00 pm a 4:00 pm', 'fanny123')
        ]
        cur.executemany(
            "INSERT INTO Profesores (NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad, Contrasena) VALUES (%s, %s, %s, %s, %s, %s);",
            profesores
        )

        # Insertar datos en Horarios
        horarios = [
            # Lógica: Lunes y Miércoles de 2:00 PM a 4:00 PM
            (1, 1, 1, 1, 'Lunes', '2025-01-01 14:00:00', '2025-01-01 16:00:00'),
            (1, 1, 1, 1, 'Miércoles', '2025-01-01 14:00:00', '2025-01-01 16:00:00'),
            # Base de Datos: Jueves y Sábados de 4:00 PM a 6:00 PM
            (2, 2, 2, 2, 'Jueves', '2025-01-01 16:00:00', '2025-01-01 18:00:00'),
            (2, 2, 2, 2, 'Sábado', '2025-01-01 16:00:00', '2025-01-01 18:00:00'),
            # Desarrollo de Plataformas: Martes y Jueves de 2:00 PM a 4:00 PM
            (3, 3, 3, 3, 'Martes', '2025-01-01 14:00:00', '2025-01-01 16:00:00'),
            (3, 3, 3, 3, 'Jueves', '2025-01-01 14:00:00', '2025-01-01 16:00:00'),
            # Investigación: Lunes y Viernes de 9:00 AM a 11:00 AM
            (4, 4, 4, 2, 'Lunes', '2025-01-01 09:00:00', '2025-01-01 11:00:00'),
            (4, 4, 4, 3, 'Viernes', '2025-01-01 09:00:00', '2025-01-01 11:00:00')
        ]
        cur.executemany(
            "INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES (%s, %s, %s, %s, %s, %s, %s);",
            horarios
        )

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
    print("Base de datos inicializada correctamente.")
    conn.close()