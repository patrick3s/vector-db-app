import os

class Config:
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///default.db')
    OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', 'http://127.0.0.1:9000')
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')