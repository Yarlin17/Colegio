# proColegio/app.py

from flask import Flask, request, jsonify, render_template, url_for, send_from_directory
from flask_bcrypt import Bcrypt  # Importar Bcrypt
import psycopg2
import psycopg2.extras

app = Flask(__name__, template_folder='templates', static_folder='static')
bcrypt = Bcrypt(app)  # Inicializar Bcrypt


def get_db_connection():
    return psycopg2.connect(
        dbname="colegio_pablo_neruda",
        user="postgres",  # Cambia por tu usuario de PostgreSQL
        password="1234",  # Cambia por tu contraseña de PostgreSQL - Consider using environment variables
        host="localhost",
        port=5432
    )

# Route for the login page (index.html)
@app.route('/')
def index():
    return render_template('index.html')

# Route for the main panel page (inicio.html)
@app.route('/inicio')
def inicio():
    # In a real application, you'd protect this route,
    # ensuring only logged-in users can access it.
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
            if bcrypt.check_password_hash(user["contrasena"], password): #
                # Store professor_id in the session/response if needed for later API calls
                return jsonify({"success": True, "tipo": "profesor", "profesor_id": user["profesor_id"], "nombre": user["nombre"], "apellido": user["apellido"]})

        # Buscar en Estudiantes
        cur.execute("SELECT Estudiante_ID, NombreEstudiante AS nombre, ApellidoEstudiante AS apellido, Contrasena FROM Estudiantes WHERE EmailEstudiante=%s", (email,))
        user = cur.fetchone()
        if user:
            if bcrypt.check_password_hash(user["contrasena"], password): #
                # Store estudiante_id in the session/response if needed for later API calls
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
    email = request.args.get('email')  # Allow filtering by email

    query = "SELECT Profesor_ID, NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad FROM Profesores WHERE 1=1"
    params = []
    if profesor_id:
        query += " AND Profesor_ID = %s"
        params.append(profesor_id)
    if email:
        query += " AND EmailProfesor = %s"
        params.append(email)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    grupo_id = request.args.get('grupo_id')  # Allow filtering by grupo ID
    estudiante_id = request.args.get('estudiante_id') # Allow filtering by student ID

    query = "SELECT * FROM Estudiantes WHERE 1=1"
    params = []
    if grupo_id:
        query += " AND Grupo_ID = %s"
        params.append(grupo_id)
    if estudiante_id:
        query += " AND Estudiante_ID = %s"
        params.append(estudiante_id)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/aulas')
def get_aulas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    aula_id = request.args.get('aula_id') #

    query = "SELECT * FROM Aulas WHERE 1=1"
    params = []
    if aula_id:
        query += " AND Aula_ID = %s"
        params.append(aula_id)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/asignaturas', methods=['GET'])
def get_asignaturas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    asignatura_id = request.args.get('asignatura_id')  # Allow filtering by asignatura ID

    query = "SELECT * FROM Asignaturas WHERE 1=1"
    params = []
    if asignatura_id:
        query += " AND Asignatura_ID = %s"
        params.append(asignatura_id)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/grupos', methods=['GET'])
def get_grupos():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    grupo_id = request.args.get('grupo_id')  # Allow filtering by grupo ID

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
    profesor_id = request.args.get('profesor_id')  # Allow filtering by professor ID
    estudiante_id = request.args.get('estudiante_id') # Filter for student's schedules

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
        # Get the group_id for the student and filter by that
        cur.execute("SELECT Grupo_ID FROM Estudiantes WHERE Estudiante_ID = %s", (estudiante_id,))
        student_group = cur.fetchone()
        if student_group:
            query += " AND h.Grupo_ID = %s"
            params.append(student_group[0])
        else:
            return jsonify([]), 200 # No group found for student, so no schedules

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

    profesor_id = request.args.get('profesor_id') #
    estudiante_id = request.args.get('estudiante_id') #
    asignatura_id = request.args.get('asignatura_id') #
    corte = request.args.get('corte') #
    tipo_nota = request.args.get('tipo_nota') #

    query = """
        SELECT n.nota_id, n.estudiante_id, n.asignatura_id, n.profesor_id, n.corte, n.tipo_nota, n.nota,
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
    return jsonify([dict(row) for row in rows])

@app.route('/api/notas', methods=['POST'])
def create_or_update_nota():
    data = request.json
    estudiante_id = data.get('estudiante_id') #
    asignatura_id = data.get('asignatura_id') #
    profesor_id = data.get('profesor_id') #
    corte = data.get('corte') #
    tipo_nota = data.get('tipo_nota') #
    nota = data.get('nota') #

    if not all([estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nota is not None]):
        return jsonify({"success": False, "message": "Datos incompletos para la nota"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if the note already exists
        cur.execute("""
            SELECT nota_id FROM Notas
            WHERE estudiante_id = %s AND asignatura_id = %s AND profesor_id = %s AND corte = %s AND tipo_nota = %s
        """, (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota))
        existing_nota = cur.fetchone()

        if existing_nota:
            # Update existing note
            cur.execute("""
                UPDATE Notas SET nota = %s
                WHERE nota_id = %s
            """, (nota, existing_nota[0]))
            nota_id = existing_nota[0]
        else:
            # Insert new note
            cur.execute("""
                INSERT INTO Notas (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nota)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING nota_id
            """, (estudiante_id, asignatura_id, profesor_id, corte, tipo_nota, nota))
            nota_id = cur.fetchone()[0]

        conn.commit()
        return jsonify({"success": True, "nota_id": nota_id, "message": "Nota guardada correctamente"}), 200
    except (Exception, psycopg2.Error) as error:
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

# NEW: Bulk Delete Notes Endpoint
@app.route('/api/notas/bulk_delete', methods=['POST'])
def bulk_delete_notas():
    data = request.json
    profesor_id = data.get('profesor_id') #
    asignatura_id = data.get('asignatura_id') #
    corte = data.get('corte') #
    tipo_nota = data.get('tipo_nota') # Optional: if deleting specific column notes

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = "DELETE FROM Notas WHERE profesor_id = %s AND asignatura_id = %s AND corte = %s"
        params = [profesor_id, asignatura_id, corte]

        if tipo_nota:
            query += " AND tipo_nota = %s"
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


# NEW: Asistencia Endpoints
@app.route('/api/asistencia', methods=['GET'])
def get_asistencia():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    estudiante_id = request.args.get('estudiante_id') #
    asignatura_id = request.args.get('asignatura_id') #
    fecha = request.args.get('fecha') #YYYY-MM-DD
    grupo_id = request.args.get('grupo_id') # Filter by group for professor view

    query = """
        SELECT a.Asistencia_ID, a.Estudiante_ID, e.NombreEstudiante, e.ApellidoEstudiante,
               a.Asignatura_ID, s.NombreAsignatura, a.Fecha, a.Presente, g.NombreGrupo
        FROM Asistencia a
        JOIN Estudiantes e ON a.Estudiante_ID = e.Estudiante_ID
        JOIN Asignaturas s ON a.Asignatura_ID = s.Asignatura_ID
        LEFT JOIN Grupos g ON e.Grupo_ID = g.Grupo_ID -- Join to get group name
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
        query += " AND e.Grupo_ID = %s" # Filter students by their group
        params.append(grupo_id)

    query += " ORDER BY a.Fecha DESC, e.NombreEstudiante, s.NombreAsignatura"

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/asistencia', methods=['POST'])
def record_asistencia():
    data = request.json
    estudiante_id = data.get('estudiante_id') #
    asignatura_id = data.get('asignatura_id') #
    fecha = data.get('fecha') #
    presente = data.get('presente') # Boolean

    if not all([estudiante_id, asignatura_id, fecha, presente is not None]):
        return jsonify({"success": False, "message": "Datos incompletos para asistencia"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if attendance already exists for this student, class, and date
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

# NEW: Advisory Endpoints (Asesorias) - Placeholder
@app.route('/api/asesorias', methods=['GET'])
def get_asesorias():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    profesor_id = request.args.get('profesor_id') #
    # You might want to add filters for student_id to show only relevant asesorias for a student

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

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        app.static_folder, 'favicon.ico', mimetype='image/vnd.microsoft.icon'
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)