# Migração Flask → FastAPI

## Mudanças Realizadas

### 1. Dependências (`requirements.txt`)
- ❌ Removido: `Flask==2.1.2`, `flask-cors`
- ✅ Adicionado: `fastapi==0.104.1`, `uvicorn[standard]==0.24.0`, `pydantic==2.5.0`

### 2. Aplicação Principal (`src/app.py`)
**Antes (Flask):**
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
```

**Depois (FastAPI):**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Vector DB API", version="1.0.0")
app.add_middleware(CORSMiddleware, ...)
```

### 3. Rotas (`src/routes/vectors.py`)
**Antes (Flask):**
```python
from flask import Blueprint, request, jsonify

vectors_bp = Blueprint('vectors', __name__)

@vectors_bp.route('/vectors', methods=['GET'])
def get_vectors():
    return jsonify(data), 200
```

**Depois (FastAPI):**
```python
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/vectors", tags=["vectors"])

@router.get("/", response_model=List[Dict])
async def get_vectors():
    return data
```

### 4. Dockerfile
**Antes:**
```dockerfile
CMD ["python", "app.py"]
```

**Depois:**
```dockerfile
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
```

## Vantagens da Migração

✅ **Performance**: FastAPI é mais rápido que Flask (baseado em Starlette/ASGI)  
✅ **Type Hints**: Validação automática com Pydantic  
✅ **Documentação Automática**: Swagger UI em `/docs` e ReDoc em `/redoc`  
✅ **Async/Await**: Suporte nativo para operações assíncronas  
✅ **Validação de Dados**: Automática via Pydantic models  

## Como Executar

### Desenvolvimento Local
```bash
cd backend
pip install -r requirements.txt
uvicorn src.app:app --reload --host 0.0.0.0 --port 5000
```

### Docker
```bash
docker-compose up --build
```

### Acessar Documentação
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Endpoints (mantidos compatíveis)

- `GET /vectors` → Listar todos os vetores
- `POST /vectors` → Criar novo vetor
- `GET /` → Mensagem de boas-vindas
