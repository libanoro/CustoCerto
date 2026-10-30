import os
import sys
import MySQLdb
from decouple import Config, RepositoryEnv

# Caminho absoluto para o .env dentro da pasta backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, 'backend', '.env')

if not os.path.exists(env_path):
    print(f"ERRO: Arquivo .env não encontrado em: {env_path}")
    sys.exit(1)

config = Config(RepositoryEnv(env_path))

db_user = config('DB_USER')
db_password = config('DB_PASSWORD')
db_host = config('DB_HOST')
db_port = config('DB_PORT', cast=int)
db_name = config('DB_NAME')

print(f"Conectando ao MySQL em {db_host}:{db_port} como '{db_user}'...")
try:
    conn = MySQLdb.connect(host=db_host, user=db_user, passwd=db_password, port=db_port)
except MySQLdb.Error as e:
    print(f"ERRO ao conectar no MySQL: {e}")
    print(r"Verifique se o serviço do MySQL está rodando e se a senha no backend\.env está correta.")
    sys.exit(1)

cursor = conn.cursor()

print(f"Criando banco de dados '{db_name}' se não existir...")
cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
conn.commit()

print("\nBancos de dados disponíveis no servidor:")
cursor.execute("SHOW DATABASES;")
for db in cursor.fetchall():
    print(f"- {db[0]}")

cursor.close()
conn.close()
print(f"\nSUCESSO: Banco de dados '{db_name}' criado/verificado com sucesso!")
