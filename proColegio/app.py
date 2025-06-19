import psycopg2
import psycopg2.extras
from flask import Flask, jsonify, request, render_template, url_for, send_from_directory
from flask_bcrypt import Bcrypt
from decimal import Decimal

app = Flask(__name__, template_folder='templates', static_folder='static')
bcrypt = Bcrypt(app)


def get_db_connection():
    # MODIFICADO: Se añade client_encoding='utf8' para asegurar la codificación correcta.
    return psycopg2.connect(
        dbname="colegio_pablo_neruda",
        user="postgres",
        password="1234",
        host="localhost",
        port=5432,
        client_encoding='utf8' 
    )

# Route for the login page (index.html)
@app.route('/')
def index():
    return render_template('index.html')

# Route for the main panel page (inicio.html)
@app.route('/inicio')
def inicio():
    return render_template('inicio.html')

@app.route('/profesor')
def profesor():
    return render_template('profesor.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email y contraseña son requeridos"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Buscar primero en Profesores
        cur.execute("SELECT Profesor_ID, NombreProfesor AS nombre, ApellidoProfesor AS apellido, Contrasena FROM Profesores WHERE EmailProfesor=%s", (email,))
        user = cur.fetchone()
        if user:
            if bcrypt.check_password_hash(user["contrasena"], password):
                return jsonify({"success": True, "tipo": "profesor", "profesor_id": user["profesor_id"], "nombre": user["nombre"], "apellido": user["apellido"]})

        # Buscar en Estudiantes
        cur.execute("SELECT Estudiante_ID, NombreEstudiante AS nombre, ApellidoEstudiante AS apellido, Contrasena FROM Estudiantes WHERE EmailEstudiante=%s", (email,))
        user = cur.fetchone()
        if user:
            if bcrypt.check_password_hash(user["contrasena"], password):
                return jsonify({"success": True, "tipo": "estudiante", "estudiante_id": user["estudiante_id"], "nombre": user["nombre"], "apellido": user["apellido"]})

        return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401
    except (Exception, psycopg2.Error) as error:
        print(f"Error during login: {error}")
        return jsonify({"success": False, "message": "Error en el servidor durante el login"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@app.route('/api/profesores', methods=['GET'])
def get_profesores():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    profesor_id = request.args.get('profesor_id')
    email = request.args.get('email')
    estudiante_id = request.args.get('estudiante_id') # Get estudiante_id

    query = "SELECT DISTINCT p.Profesor_ID, p.NombreProfesor, p.ApellidoProfesor, p.EmailProfesor, p.TelefonoProfesor, p.Disponibilidad FROM Profesores p WHERE 1=1"
    params = []

    if profesor_id:
        query += " AND p.Profesor_ID = %s"
        params.append(profesor_id)
    if email:
        query += " AND p.EmailProfesor = %s"
        params.append(email)
    
    if estudiante_id: # Filter by student's assigned teachers
        cur.execute("SELECT Grupo_ID FROM Estudiantes WHERE Estudiante_ID = %s", (estudiante_id,))
        student_group = cur.fetchone()
        
        if student_group:
            group_id = student_group['grupo_id']
            query += """
                AND p.Profesor_ID IN (
                    SELECT h.Profesor_ID FROM Horarios h
                    WHERE h.Grupo_ID = %s
                )
            """
            params.append(group_id)
        else:
            return jsonify([]), 200

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    grupo_id = request.args.get('grupo_id')
    estudiante_id = request.args.get('estudiante_id')
    email = request.args.get('email') 

    query = "SELECT * FROM Estudiantes WHERE 1=1"
    params = []
    if grupo_id:
        query += " AND Grupo_ID = %s"
        params.append(grupo_id)
    if estudiante_id:
        query += " AND Estudiante_ID = %s"
        params.append(estudiante_id)
    if email: 
        query += " AND EmailEstudiante = %s" 
        params.append(email) 

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/aulas', methods=['GET'])
def get_aulas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    aula_id = request.args.get('aula_id')
    estudiante_id = request.args.get('estudiante_id') # Get estudiante_id

    query = "SELECT DISTINCT a.* FROM Aulas a WHERE 1=1"
    params = []

    if aula_id:
        query += " AND a.Aula_ID = %s"
        params.append(aula_id)
    
    if estudiante_id: # Filter by student's assigned aulas
        cur.execute("SELECT Grupo_ID FROM Estudiantes WHERE Estudiante_ID = %s", (estudiante_id,))
        student_group = cur.fetchone()

        if student_group:
            group_id = student_group['grupo_id']
            query += """
                AND a.Aula_ID IN (
                    SELECT h.Aula_ID FROM Horarios h
                    WHERE h.Grupo_ID = %s
                )
            """
            params.append(group_id)
        else:
            return jsonify([]), 200

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route('/api/asignaturas', methods=['GET'])
def get_asignaturas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    asignatura_id = request.args.get('asignatura_id')
    estudiante_id = request.args.get('estudiante_id') # Get estudiante_id from query parameters

    query = "SELECT DISTINCT s.* FROM Asignaturas s WHERE 1=1" # Use DISTINCT to avoid duplicates
    params = []

    if asignatura_id:
        query += " AND s.Asignatura_ID = %s"
        params.append(asignatura_id)
    
    if estudiante_id: # Filter by student's assigned subjects
        # First, find the student's group_id
        cur.execute("SELECT Grupo_ID FROM Estudiantes WHERE Estudiante_ID = %s", (estudiante_id,))
        student_group = cur.fetchone()
        
        if student_group:
            group_id = student_group['grupo_id']
            # Join with Horarios to find subjects taught to this group
            query += """
                AND s.Asignatura_ID IN (
                    SELECT h.Asignatura_ID FROM Horarios h
                    WHERE h.Grupo_ID = %s
                )
            """
            params.append(group_id)
        else:
            # If student not found or has no group, return empty
            return jsonify([]), 200

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/grupos', methods=['GET'])
def get_grupos():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    grupo_id = request.args.get('grupo_id')

    query = "SELECT * FROM Grupos WHERE 1=1"
    params = []
    if grupo_id:
        query += " AND Grupo_ID = %s"
        params.append(grupo_id)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/horarios', methods=['GET'])
def get_horarios():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    profesor_id = request.args.get('profesor_id')
    estudiante_id = request.args.get('estudiante_id')

    query = """
        SELECT h.Horario_ID, h.Asignatura_ID, s.NombreAsignatura,
               h.Profesor_ID, p.NombreProfesor, p.ApellidoProfesor,
               h.Aula_ID, a.NombreAula,
               h.Grupo_ID, g.NombreGrupo,
               h.DiaSemana, h.HoraInicio, h.HoraFin
        FROM Horarios h
        JOIN Asignaturas s ON h.Asignatura_ID = s.Asignatura_ID
        JOIN Profesores p ON h.Profesor_ID = p.Profesor_ID
        JOIN Aulas a ON h.Aula_ID = a.Aula_ID
        JOIN Grupos g ON h.Grupo_ID = g.Grupo_ID
        WHERE 1=1
    """
    params = []
    if profesor_id:
        query += " AND h.Profesor_ID = %s"
        params.append(profesor_id)
    if estudiante_id:
        cur.execute("SELECT Grupo_ID FROM Estudiantes WHERE Estudiante_ID = %s", (estudiante_id,))
        student_group = cur.fetchone()
        if student_group:
            query += " AND h.Grupo_ID = %s"
            params.append(student_group[0])
        else:
            return jsonify([]), 200

    query += " ORDER BY h.DiaSemana, h.HoraInicio"

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/notas', methods=['GET'])
def get_notas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    profesor_id = request.args.get('profesor_id')
    estudiante_id = request.args.get('estudiante_id')
    asignatura_id = request.args.get('asignatura_id')
    corte = request.args.get('corte')
    tipo_nota = request.args.get('tipo_nota')

    query = """
        SELECT n.nota_id, n.estudiante_id, n.asignatura_id, n.profesor_id, n.corte, n.tipo_nota, n.nota,
               n.nombrecolumnaextra, 
               e.NombreEstudiante, e.ApellidoEstudiante, a.NombreAsignatura,
               p.NombreProfesor, p.ApellidoProfesor
        FROM Notas n
        JOIN Estudiantes e ON n.estudiante_id = e.Estudiante_ID
        JOIN Asignaturas a ON n.asignatura_id = a.Asignatura_ID
        JOIN Profesores p ON n.profesor_id = p.Profesor_ID
        WHERE 1=1
    """
    params = []

    if profesor_id:
        query += " AND n.profesor_id = %s"
        params.append(profesor_id)
    if estudiante_id:
        query += " AND n.estudiante_id = %s"
        params.append(estudiante_id)
    if asignatura_id:
        query += " AND n.asignatura_id = %s"
        params.append(asignatura_id)
    if corte:
        query += " AND n.corte = %s"
        params.append(corte)
    if tipo_nota:
        query += " AND n.tipo_nota = %s"
        params.append(tipo_nota)

    query += " ORDER BY n.estudiante_id, n.asignatura_id, n.profesor_id, n.corte, n.tipo_nota"

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    processed_rows = []
    for row in rows:
        row_dict = dict(row)
        if 'nota' in row_dict and isinstance(row_dict['nota'], Decimal):
            row_dict['nota'] = float(row_dict['nota'])
        processed_rows.append(row_dict)

    return jsonify(processed_rows)

@app.route('/api/notas', methods=['POST'])
def create_or_update_nota():
    data = request.json
    estudiante_id = data.get('estudiante_id')
    asignatura_id = data.get('asignatura_id')
    profesor_id = data.get('profesor_id')
    corte = data.get('corte')
    tipo_nota = data.get('tipo_nota')
    nombre_columna_extra = data.get('nombre_columna_extra') 
    nota = data.get('nota')

    if not all([estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nota is not None]):
        return jsonify({"success": False, "message": "Datos incompletos para la nota"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor) # Use DictCursor to get column names

        # Determinar si es una actualización o una nueva nota
        cur.execute("SELECT nota FROM Notas WHERE estudiante_id = %s AND asignatura_id = %s AND profesor_id = %s AND corte = %s AND tipo_nota = %s",
                    (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota))
        existing_nota_record = cur.fetchone()
        
        # Convertir la nota entrante a Decimal para una comparación precisa
        new_nota_decimal = Decimal(str(nota))
        
        # Solo crear notificación si la nota cambia.
        # existing_nota_record será None si es la primera vez que se ingresa esta nota
        # o si la nota existente es diferente.
        should_notify = existing_nota_record is None or existing_nota_record['nota'] != new_nota_decimal

        if existing_nota_record:
            cur.execute("""
                UPDATE Notas SET nota = %s, nombrecolumnaextra = %s
                WHERE estudiante_id = %s AND asignatura_id = %s AND profesor_id = %s AND corte = %s AND tipo_nota = %s
                RETURNING nota_id
            """, (nota, nombre_columna_extra, estudiante_id, asignatura_id, profesor_id, corte, tipo_nota))
            nota_id = cur.fetchone()[0]
        else:
            cur.execute("""
                INSERT INTO Notas (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nombrecolumnaextra, nota)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING nota_id
            """, (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nombre_columna_extra, nota)) 
            nota_id = cur.fetchone()[0]
        
        # --- AÑADIDO: Lógica de Notificación ---
        if should_notify:
            # Obtener nombres para el mensaje de la notificación
            cur.execute("SELECT NombreProfesor, ApellidoProfesor FROM Profesores WHERE Profesor_ID = %s", (profesor_id,))
            profesor = cur.fetchone()
            cur.execute("SELECT NombreAsignatura FROM Asignaturas WHERE Asignatura_ID = %s", (asignatura_id,))
            asignatura = cur.fetchone()
            
            if profesor and asignatura:
                mensaje = f"El profesor {profesor['nombreprofesor']} {profesor['apellidoprofesor']} ha actualizado tus notas en la asignatura de {asignatura['nombreasignatura']}."
                cur.execute("""
                    INSERT INTO Notificaciones (Estudiante_ID, Mensaje, Url)
                    VALUES (%s, %s, %s)
                """, (estudiante_id, mensaje, '/mis-notas')) # URL para redirigir en el futuro

        # ------------------------------------

        conn.commit()
        return jsonify({"success": True, "nota_id": nota_id, "message": "Nota guardada correctamente"}), 200
    except (Exception, psycopg2.Error) as error:
        if conn:
            conn.rollback()
        print(f"Error al guardar la nota: {error}")
        return jsonify({"success": False, "message": f"Error al guardar la nota: {error}"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@app.route('/api/notas/<int:nota_id>', methods=['DELETE'])
def delete_nota(nota_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM Notas WHERE nota_id=%s", (nota_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Nota eliminada correctamente"}), 200
    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        print(f"Error al eliminar la nota: {error}")
        return jsonify({"success": False, "message": f"Error al eliminar la nota: {error}"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@app.route('/api/notas/bulk_delete', methods=['POST'])
def bulk_delete_notas():
    data = request.json
    profesor_id = data.get('profesor_id')
    asignatura_id = data.get('asignatura_id')
    corte = data.get('corte')
    tipo_nota = data.get('tipo_nota')
    grupo_id = data.get('grupo_id') # Get grupo_id from request

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Build the DELETE query dynamically
        # Modified to join with Estudiantes and filter by Grupo_ID
        query = """
            DELETE FROM Notas n
            USING Estudiantes e
            WHERE n.estudiante_id = e.Estudiante_ID
            AND n.profesor_id = %s
            AND n.asignatura_id = %s
            AND n.corte = %s
        """
        params = [profesor_id, asignatura_id, corte]

        if grupo_id: # Conditionally add group filter
            query += " AND e.Grupo_ID = %s"
            params.append(grupo_id)

        if tipo_nota: # Conditionally add type filter (for deleting single column)
            query += " AND n.tipo_nota = %s"
            params.append(tipo_nota)

        cur.execute(query, params)
        conn.commit()
        return jsonify({"success": True, "message": "Notas eliminadas correctamente."}), 200
    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        print(f"Error al eliminar notas en masa: {error}")
        return jsonify({"success": False, "message": f"Error al eliminar notas en masa: {error}"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()


@app.route('/api/asistencia', methods=['GET'])
def get_asistencia():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    estudiante_id = request.args.get('estudiante_id') 
    asignatura_id = request.args.get('asignatura_id') 
    fecha = request.args.get('fecha') 
    grupo_id = request.args.get('grupo_id') 

    query = """
        SELECT a.Asistencia_ID, a.Estudiante_ID, e.NombreEstudiante, e.ApellidoEstudiante,
               a.Asignatura_ID, s.NombreAsignatura, a.Fecha, a.Presente, g.NombreGrupo
        FROM Asistencia a
        JOIN Estudiantes e ON a.Estudiante_ID = e.Estudiante_ID
        JOIN Asignaturas s ON a.Asignatura_ID = s.Asignatura_ID
        LEFT JOIN Grupos g ON e.Grupo_ID = g.Grupo_ID 
        WHERE 1=1
    """
    params = []

    if estudiante_id:
        query += " AND a.Estudiante_ID = %s"
        params.append(estudiante_id)
    if asignatura_id:
        query += " AND a.Asignatura_ID = %s"
        params.append(asignatura_id)
    if fecha:
        query += " AND a.Fecha = %s"
        params.append(fecha)
    if grupo_id:
        query += " AND e.Grupo_ID = %s" 
        params.append(grupo_id)

    query += " ORDER BY a.Fecha DESC, e.NombreEstudiante, s.NombreAsignatura"

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    print(f"DEBUG: Asistencia API returning: {[dict(row) for row in rows]}")

    return jsonify([dict(row) for row in rows])

@app.route('/api/asistencia', methods=['POST'])
def record_asistencia():
    data = request.json
    estudiante_id = data.get('estudiante_id')
    asignatura_id = data.get('asignatura_id')
    fecha = data.get('fecha')
    presente = data.get('presente')

    if not all([estudiante_id, asignatura_id, fecha, presente is not None]):
        return jsonify({"success": False, "message": "Datos incompletos para asistencia"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT Asistencia_ID FROM Asistencia
            WHERE Estudiante_ID = %s AND Asignatura_ID = %s AND Fecha = %s
        """, (estudiante_id, asignatura_id, fecha))
        existing_attendance = cur.fetchone()

        if existing_attendance:
            cur.execute("""
                UPDATE Asistencia SET Presente = %s
                WHERE Asistencia_ID = %s
            """, (presente, existing_attendance[0]))
            asistencia_id = existing_attendance[0]
            action = "updated"
        else:
            cur.execute("""
                INSERT INTO Asistencia (Estudiante_ID, Asignatura_ID, Fecha, Presente)
                VALUES (%s, %s, %s, %s)
                RETURNING Asistencia_ID
            """, (estudiante_id, asignatura_id, fecha, presente))
            asistencia_id = cur.fetchone()[0]
            action = "created"

        conn.commit()
        return jsonify({"success": True, "asistencia_id": asistencia_id, "message": f"Asistencia {action} correctamente"}), 200
    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        print(f"Error al registrar asistencia: {error}")
        return jsonify({"success": False, "message": f"Error al registrar asistencia: {error}"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@app.route('/api/asesorias', methods=['GET'])
def get_asesorias():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    profesor_id = request.args.get('profesor_id')

    query = """
        SELECT a.Asesoria_ID, a.Profesor_ID, p.NombreProfesor, p.ApellidoProfesor,
               a.Titulo, a.Descripcion, a.Fecha, a.HoraInicio, a.HoraFin,
               a.Aula_ID, au.NombreAula, a.Capacidad
        FROM Asesorias a
        JOIN Profesores p ON a.Profesor_ID = p.Profesor_ID
        LEFT JOIN Aulas au ON a.Aula_ID = au.Aula_ID
        WHERE 1=1
    """
    params = []
    if profesor_id:
        query += " AND a.Profesor_ID = %s"
        params.append(profesor_id)

    query += " ORDER BY a.Fecha, a.HoraInicio"

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/cuadro_honor', methods=['GET'])
def get_cuadro_honor():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    corte = request.args.get('corte', type=int)

    if corte:
        query = """
            SELECT
                e.Estudiante_ID,
                e.NombreEstudiante,
                e.ApellidoEstudiante,
                AVG(n.nota) AS promedio_corte
            FROM Estudiantes e
            JOIN Notas n ON e.Estudiante_ID = n.estudiante_id
            WHERE n.corte = %s
            GROUP BY e.Estudiante_ID, e.NombreEstudiante, e.ApellidoEstudiante
            ORDER BY promedio_corte DESC
            LIMIT 5;
        """
        params = (corte,)
    else:
        query = """
            SELECT
                e.Estudiante_ID,
                e.NombreEstudiante,
                e.ApellidoEstudiante,
                AVG(n.nota) AS promedio_corte
            FROM Estudiantes e
            JOIN Notas n ON e.Estudiante_ID = n.estudiante_id
            GROUP BY e.Estudiante_ID, e.NombreEstudiante, e.ApellidoEstudiante
            ORDER BY promedio_corte DESC
            LIMIT 5;
        """
        params = ()

    try:
        cur.execute(query, params)
        rows = cur.fetchall()
        processed_rows = []
        for row in rows:
            row_dict = dict(row)
            if 'promedio_corte' in row_dict and isinstance(row_dict['promedio_corte'], Decimal):
                row_dict['promedio_corte'] = float(row_dict['promedio_corte'])
            processed_rows.append(row_dict)
        return jsonify(processed_rows), 200
    except (Exception, psycopg2.Error) as error:
        print(f"Error al obtener el cuadro de honor: {error}")
        return jsonify({"success": False, "message": f"Error al obtener el cuadro de honor: {error}"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

# --- AÑADIDO: Endpoints de Notificaciones ---

@app.route('/api/notificaciones', methods=['GET'])
def get_notificaciones():
    estudiante_id = request.args.get('estudiante_id')
    if not estudiante_id:
        return jsonify({"success": False, "message": "Falta el ID del estudiante"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT Notificacion_ID, Mensaje, FechaCreacion, Leida, Url
            FROM Notificaciones
            WHERE Estudiante_ID = %s
            ORDER BY FechaCreacion DESC
            LIMIT 20
        """, (estudiante_id,))
        notificaciones = cur.fetchall()
        return jsonify([dict(row) for row in notificaciones])
    except (Exception, psycopg2.Error) as error:
        print(f"Error al obtener notificaciones: {error}")
        return jsonify({"success": False, "message": "Error del servidor al obtener notificaciones"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@app.route('/api/notificaciones/marcar_leidas', methods=['POST'])
def marcar_notificaciones_leidas():
    data = request.json
    estudiante_id = data.get('estudiante_id')
    if not estudiante_id:
        return jsonify({"success": False, "message": "Falta el ID del estudiante"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE Notificaciones
            SET Leida = TRUE
            WHERE Estudiante_ID = %s AND Leida = FALSE
        """, (estudiante_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Notificaciones marcadas como leídas"})
    except (Exception, psycopg2.Error) as error:
        if conn:
            conn.rollback()
        print(f"Error al marcar notificaciones como leídas: {error}")
        return jsonify({"success": False, "message": "Error del servidor"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

# ----------------------------------------

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        app.static_folder, 'favicon.ico', mimetype='image/vnd.microsoft.icon'
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)