import psycopg2

def run_sql_file(filename, conn):
    with open(filename, 'r', encoding='utf-8') as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()

if __name__ == "__main__":
    conn = psycopg2.connect(
        dbname="colegio_pablo_neruda",
        user="postgres",         # Cambia por tu usuario de PostgreSQL
        password="0102",  # Cambia por tu contraseña de PostgreSQL
        host="localhost",
        port=5432
    )
    run_sql_file("colegio_pablo_neruda.sql", conn) #
    print("Base de datos inicializada correctamente.")
    conn.close()