SELECT drop_table_if_exists('horarios');
SELECT drop_table_if_exists('estudiantes');
SELECT drop_table_if_exists('grupos');
SELECT drop_table_if_exists('asignaturas');
SELECT drop_table_if_exists('profesores');
SELECT drop_table_if_exists('aulas');
-- **WARNING: This will delete existing data!** Use with caution.
-- PostgreSQL doesn't have "EXECUTE IMMEDIATE" in the same way, so we'll use a function for dynamic DROP

CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name TEXT) RETURNS void AS $$
BEGIN
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(table_name) || ' CASCADE';
EXCEPTION
    WHEN undefined_table THEN
        -- Do nothing (table doesn't exist)
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION drop_sequence_if_exists(seq_name TEXT) RETURNS void AS $$
BEGIN
    EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(seq_name);
EXCEPTION
    WHEN undefined_object THEN
        -- Do nothing (sequence doesn't exist)
END;
$$ LANGUAGE plpgsql;

-- Drop Tables (using the function, in dependency order)
SELECT drop_table_if_exists('asistencia'); -- New: drop attendance table first
SELECT drop_table_if_exists('notas');      -- Drop notes table next
SELECT drop_table_if_exists('horarios');
SELECT drop_table_if_exists('asesorias');  -- New: drop asesorias table
SELECT drop_table_if_exists('estudiantes');
SELECT drop_table_if_exists('grupos');
SELECT drop_table_if_exists('asignaturas');
SELECT drop_table_if_exists('profesores');
SELECT drop_table_if_exists('aulas');


-- Drop Sequences (using the function - though SERIAL handles this in PostgreSQL)
SELECT drop_sequence_if_exists('seq_aulas');
SELECT drop_sequence_if_exists('seq_profesores');
SELECT drop_sequence_if_exists('seq_asignaturas');
SELECT drop_sequence_if_exists('seq_grupos');
SELECT drop_sequence_if_exists('seq_estudiantes');
SELECT drop_sequence_if_exists('seq_horarios');
SELECT drop_sequence_if_exists('seq_notas');      -- New: for notas
SELECT drop_sequence_if_exists('seq_asistencia'); -- New: for asistencia
SELECT drop_sequence_if_exists('seq_asesorias');  -- New: for asesorias


-- Create Tables
CREATE TABLE Grupos (
    Grupo_ID INTEGER PRIMARY KEY,
    NombreGrupo VARCHAR(50) NOT NULL,
    NivelGrupo VARCHAR(50),
    CapacidadGrupo INTEGER,
    CONSTRAINT chk_CapacidadGrupo CHECK (CapacidadGrupo >= 10 AND CapacidadGrupo <= 15)
);

CREATE TABLE Estudiantes (
    Estudiante_ID SERIAL PRIMARY KEY,
    NombreEstudiante VARCHAR(255) NOT NULL,
    ApellidoEstudiante VARCHAR(255) NOT NULL,
    EmailEstudiante VARCHAR(100) UNIQUE,
    FechaNacimiento DATE,
    Grupo_ID INTEGER REFERENCES Grupos(Grupo_ID),
    Contrasena VARCHAR(100)
);

CREATE TABLE Aulas (
    Aula_ID SERIAL PRIMARY KEY,
    NombreAula VARCHAR(50) NOT NULL,
    Capacidad INTEGER,
    TipoAula VARCHAR(50),
    Ubicacion VARCHAR(100)
);

CREATE TABLE Profesores (
    Profesor_ID SERIAL PRIMARY KEY,
    NombreProfesor VARCHAR(255) NOT NULL,
    ApellidoProfesor VARCHAR(255) NOT NULL,
    EmailProfesor VARCHAR(100) UNIQUE,
    TelefonoProfesor VARCHAR(20),
    Disponibilidad VARCHAR(255),
    Contrasena VARCHAR(100)
);

CREATE TABLE Asignaturas (
    Asignatura_ID SERIAL PRIMARY KEY,
    NombreAsignatura VARCHAR(100) NOT NULL,
    DescripcionAsignatura VARCHAR(255),
    Creditos INTEGER,
    DuracionClase INTEGER,
    CONSTRAINT chk_DuracionClase CHECK (DuracionClase >= 120 AND DuracionClase <= 240)
);

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

CREATE TABLE Notas (
    nota_id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES Estudiantes(Estudiante_ID),
    asignatura_id INTEGER REFERENCES Asignaturas(Asignatura_ID),
    profesor_id INTEGER REFERENCES Profesores(Profesor_ID),
    corte INTEGER NOT NULL,
    tipo_nota VARCHAR(50) NOT NULL,
    nota NUMERIC(4, 2) NOT NULL CHECK (nota >= 0 AND nota <= 5),
    UNIQUE (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota)
);

CREATE TABLE Asistencia (
    Asistencia_ID SERIAL PRIMARY KEY,
    Estudiante_ID INTEGER REFERENCES Estudiantes(Estudiante_ID),
    Asignatura_ID INTEGER REFERENCES Asignaturas(Asignatura_ID),
    Fecha DATE NOT NULL,
    Presente BOOLEAN NOT NULL,
    UNIQUE (Estudiante_ID, Asignatura_ID, Fecha)
);

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

-- Insert Data
INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES
(1, 'AR', 'Nivel I', 12);
INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES
(2, 'BR', 'Nivel II', 15);
INSERT INTO Grupos (Grupo_ID, NombreGrupo, NivelGrupo, CapacidadGrupo) VALUES
(3, 'CR', 'Nivel III', 10);

--insert estudiantes
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Kevin', 'Marquez', 'kevin.marquez@email.com', '2003-05-10', 1, 'kevin123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Sebastian', 'Rolon', 'sebastian.rolon@email.com', '2004-11-22', 2, 'sebastian123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Julio', 'Carrillo', 'julio.carrillo@email.com', '2002-08-15', 3, 'julio123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Geron', 'Vergara', 'geron.vergara@email.com', '2003-02-28', 3, 'geron123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Brian', 'Acevedo', 'brian.acevedo@email.com', '2005-01-05', 1, 'brian123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Einer', 'Alvear', 'einer.alvear@email.com', '2002-12-19', 2, 'einer123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Brayan', 'Amado', 'brayan.amado@email.com', '2004-06-30', 1, 'brayan123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Andres', 'Vera', 'andres.vera@email.com', '2003-09-08', 2, 'andres123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Julian', 'Pulido', 'julian.pulido@email.com', '2002-04-01', 1, 'julian123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Juan', 'Ochoa', 'juan.ochoa@email.com', '2004-03-12', 3, 'juan123');
INSERT INTO Estudiantes (NombreEstudiante, ApellidoEstudiante, EmailEstudiante, FechaNacimiento, Grupo_ID, Contrasena) VALUES
('Jerley', 'Hernandez', 'jerley.hernandez@email.com', '2003-07-26', 3, 'jerley123');

--insert aulas
INSERT INTO Aulas (NombreAula, Capacidad, TipoAula, Ubicacion) VALUES
('GM 104-2', 30, 'Normal', 'Primer Piso');
INSERT INTO Aulas (NombreAula, Capacidad, TipoAula, Ubicacion) VALUES
('GM 104-1', 30, 'Normal', 'Primer Piso');
INSERT INTO Aulas (NombreAula, Capacidad, TipoAula, Ubicacion) VALUES
('GM 209-1', 25, 'Laboratorio', 'Segundo Piso');
INSERT INTO Aulas (NombreAula, Capacidad, TipoAula, Ubicacion) VALUES
('GM 209-2', 25, 'Laboratorio', 'Segundo Piso');

--insert asignaturas
INSERT INTO Asignaturas (NombreAsignatura, DescripcionAsignatura, Creditos, DuracionClase) VALUES
('Base de Datos', 'Fundamentos de bases de datos relacionales', 4, 180);
INSERT INTO Asignaturas (NombreAsignatura, DescripcionAsignatura, Creditos, DuracionClase) VALUES
('Logica', 'Principios de lógica matemática y programación', 3, 120);
INSERT INTO Asignaturas (NombreAsignatura, DescripcionAsignatura, Creditos, DuracionClase) VALUES
('Investigacion', 'Metodología de la investigación', 2, 240);
INSERT INTO Asignaturas (NombreAsignatura, DescripcionAsignatura, Creditos, DuracionClase) VALUES
('Desarrollo de Plataformas', 'Desarrollo de aplicaciones web', 4, 150);

--insert profesores
INSERT INTO Profesores (NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad, Contrasena) VALUES
('Harvey', 'Gamboa', 'harvey.gamboa@email.com', '123-456-7890', '4:00 pm a 6:00 pm', 'harvey123');
INSERT INTO Profesores (NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad, Contrasena) VALUES
('Jesus', 'Duran', 'jesus.duran@email.com', '987-654-3210', '12:00 pm a 4:00 pm', 'jesus123');
INSERT INTO Profesores (NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad, Contrasena) VALUES
('Eduardo', 'Rueda', 'eduardo.rueda@email.com', '555-123-4567', '9:00 am a 11:00 am', 'eduardo123');
INSERT INTO Profesores (NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad, Contrasena) VALUES
('Fanny', 'Casadiego', 'fanny.casadiego@email.com', '111-222-3333', '2:00 pm a 4:00 pm', 'fanny123');

--insert horarios
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(1, 1, 1, 1, 'Lunes', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(1, 1, 1, 1, 'Miércoles', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(2, 2, 2, 2, 'Jueves', '2025-01-01 16:00:00', '2025-01-01 18:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(2, 2, 2, 2, 'Sábado', '2025-01-01 16:00:00', '2025-01-01 18:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(3, 3, 3, 3, 'Martes', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(3, 3, 3, 3, 'Jueves', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(4, 4, 4, 2, 'Lunes', '2025-01-01 09:00:00', '2025-01-01 11:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(4, 4, 4, 3, 'Viernes', '2025-01-01 09:00:00', '2025-01-01 11:00:00');

-- Insert Asistencia data
INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente) VALUES
(1, 1, '2025-06-03', TRUE);
INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente) VALUES
(1, 1, '2025-06-05', FALSE);
INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente) VALUES
(2, 2, '2025-06-03', TRUE);
INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente) VALUES
(3, 3, '2025-06-03', TRUE);
INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente) VALUES
(4, 4, '2025-06-03', TRUE);

-- Insert Asesorias data (Example)
INSERT INTO Asesorias (Profesor_ID, Titulo, Descripcion, Fecha, HoraInicio, HoraFin, Aula_ID, Capacidad) VALUES
(1, 'Asesoría de Lógica', 'Repaso de conceptos de lógica proposicional.', '2025-06-10', '10:00:00', '11:00:00', 1, 5);
INSERT INTO Asesorias (Profesor_ID, Titulo, Descripcion, Fecha, HoraInicio, HoraFin, Aula_ID, Capacidad) VALUES
(2, 'Ayuda con SQL', 'Sesión de preguntas y respuestas sobre consultas SQL.', '2025-06-12', '15:00:00', '16:30:00', 2, 8);