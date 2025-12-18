from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.vectors import router as vector_router

app = FastAPI(title="Vector DB API", version="1.0.0")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique as origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vector_router)

@app.get("/")
def home():
    return {"message": "Welcome to the Vector DB API!"}

