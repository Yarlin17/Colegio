from flask import Flask, request, jsonify, render_template, url_for, send_from_directory
import psycopg2
import psycopg2.extras

# app = Flask(__name__) # Standard way if templates/static are at the same level
# If app.py is inside proColegio, and templates/static are also inside proColegio:
app = Flask(__name__, template_folder='templates', static_folder='static')


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
    # The SQL query uses TelefonoProfesor as the password
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"success": False, "message": "Email y contraseña son requeridos"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        # Buscar primero en Profesores
        cur.execute("SELECT NombreProfesor AS nombre, ApellidoProfesor AS apellido FROM Profesores WHERE EmailProfesor=%s AND Contrasena=%s", (email, password))
        user = cur.fetchone()
        if user:
            return jsonify({"success": True, "tipo": "profesor", "nombre": user["nombre"], "apellido": user["apellido"]})

        # Buscar en Estudiantes
        cur.execute("SELECT NombreEstudiante AS nombre, ApellidoEstudiante AS apellido FROM Estudiantes WHERE EmailEstudiante=%s AND Contrasena=%s", (email, password))
        user = cur.fetchone()
        if user:
            return jsonify({"success": True, "tipo": "estudiante", "nombre": user["nombre"], "apellido": user["apellido"]})

        return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401
    except (Exception, psycopg2.Error) as error:
        print(f"Error during login: {error}")
        return jsonify({"success": False, "message": "Error en el servidor durante el login"}), 500
    finally:
        if conn:
            cur.close()
            conn.close()

@app.route('/api/profesores')
def get_profesores():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT Profesor_ID, NombreProfesor, ApellidoProfesor, EmailProfesor, TelefonoProfesor, Disponibilidad FROM Profesores") #
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows]) #

# You can add other API endpoints here if you intend for Flask to handle them,
# similar to what's in your servidor.js. For example:

@app.route('/api/estudiantes')
def get_estudiantes():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT * FROM Estudiantes")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/aulas')
def get_aulas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT * FROM Aulas")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/asignaturas')
def get_asignaturas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT * FROM Asignaturas")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/grupos')
def get_grupos():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT * FROM Grupos")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/horarios')
def get_horarios():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    # Consider joining with other tables for more meaningful data (e.g., AsignaturaNombre, ProfesorNombre)
    cur.execute("SELECT * FROM Horarios")
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