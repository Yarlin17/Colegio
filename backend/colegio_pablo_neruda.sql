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

-- Drop Tables (using the function)
SELECT drop_table_if_exists('horarios');
SELECT drop_table_if_exists('estudiantes');
SELECT drop_table_if_exists('grupos');
SELECT drop_table_if_exists('asignaturas');
SELECT drop_table_if_exists('profesores');
SELECT drop_table_if_exists('aulas');

-- Drop Sequences (using the function)
SELECT drop_sequence_if_exists('seq_aulas');
SELECT drop_sequence_if_exists('seq_profesores');
SELECT drop_sequence_if_exists('seq_asignaturas');
SELECT drop_sequence_if_exists('seq_grupos');
SELECT drop_sequence_if_exists('seq_estudiantes');
SELECT drop_sequence_if_exists('seq_horarios');

-- Create Tables
CREATE TABLE Grupos (
    Grupo_ID INTEGER PRIMARY KEY,
    NombreGrupo VARCHAR(50) NOT NULL,
    NivelGrupo VARCHAR(50),  -- Or VARCHAR(10) if you want to limit the size
    CapacidadGrupo INTEGER,
    CONSTRAINT chk_CapacidadGrupo CHECK (CapacidadGrupo >= 10 AND CapacidadGrupo <= 15) -- Optional constraint
);

CREATE TABLE Estudiantes (
    Estudiante_ID SERIAL PRIMARY KEY, -- Auto-incrementing primary key
    NombreEstudiante VARCHAR(255) NOT NULL,
    ApellidoEstudiante VARCHAR(255) NOT NULL,
    EmailEstudiante VARCHAR(100) UNIQUE,
    FechaNacimiento DATE,
    Grupo_ID INTEGER REFERENCES Grupos(Grupo_ID), -- Corrected foreign key syntax
    Contrasena VARCHAR(100) -- Nueva columna para contraseña
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
    DuracionClase INTEGER,  -- Duration in minutes
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

-- Sequences (PostgreSQL handles auto-increment differently, often with SERIAL)
-- Sequences are generally not created manually in PostgreSQL unless you have very specific needs.
-- SERIAL is used in the CREATE TABLE statements above for auto-incrementing.
-- If you need custom sequences, you can create them like this (but it's often unnecessary):
-- CREATE SEQUENCE seq_aulas START WITH 1 INCREMENT BY 1;
-- CREATE SEQUENCE seq_profesores START WITH 1 INCREMENT BY 1;
-- CREATE SEQUENCE seq_asignaturas START WITH 1 INCREMENT BY 1;
-- CREATE SEQUENCE seq_grupos START WITH 1 INCREMENT BY 1;
-- CREATE SEQUENCE seq_estudiantes START WITH 1 INCREMENT BY 1;
-- CREATE SEQUENCE seq_horarios START WITH 1 INCREMENT BY 1;

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
-- Lógica: Lunes y Miércoles de 2:00 PM a 4:00 PM
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(1, 1, 1, 1, 'Lunes', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(1, 1, 1, 1, 'Miércoles', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
-- Base de Datos: Jueves y Sábados de 4:00 PM a 6:00 PM
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(2, 2, 2, 2, 'Jueves', '2025-01-01 16:00:00', '2025-01-01 18:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(2, 2, 2, 2, 'Sábado', '2025-01-01 16:00:00', '2025-01-01 18:00:00');
-- Desarrollo de Plataformas: Martes y Jueves de 2:00 PM a 4:00 PM
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(3, 3, 3, 3, 'Martes', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(3, 3, 3, 3, 'Jueves', '2025-01-01 14:00:00', '2025-01-01 16:00:00');
-- Investigación: Lunes y Viernes de 9:00 AM a 11:00 AM
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(4, 4, 4, 2, 'Lunes', '2025-01-01 09:00:00', '2025-01-01 11:00:00');
INSERT INTO Horarios (Asignatura_ID, Profesor_ID, Aula_ID, Grupo_ID, DiaSemana, HoraInicio, HoraFin) VALUES
(4, 4, 4, 3, 'Viernes', '2025-01-01 09:00:00', '2025-01-01 11:00:00');