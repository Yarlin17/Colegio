from flask import Flask, request, jsonify
import psycopg2
import psycopg2.extras

app = Flask(__name__)

def get_db_connection():
    return psycopg2.connect(
        dbname="colegio_pablo_neruda",
        user="postgres",         # Cambia por tu usuario de PostgreSQL
        password="1234",  # Cambia por tu contraseña de PostgreSQL
        host="localhost",
        port=5432
    )

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password') # Esta variable 'password' se usará para la consulta
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    # Aquí se asume que la contraseña es el teléfono (ajusta si tienes columna de contraseña)
    cur.execute("SELECT * FROM Profesores WHERE EmailProfesor=%s AND TelefonoProfesor=%s", (email, password)) #
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return jsonify({"success": True, "nombre": user["NombreProfesor"], "apellido": user["ApellidoProfesor"]}) #
    else:
        return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401 #

@app.route('/api/profesores')
def get_profesores():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT * FROM Profesores") #
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(row) for row in rows])

if __name__ == "__main__":
    app.run(debug=True, port=5000)