from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from ..services.vector_db_service import get_db_service, VectorDBService
from ..services.ollama_service import OllamaService

router = APIRouter(prefix="/vectors", tags=["vectors"])

# Inicializa serviços
ollama_service = OllamaService()

class VectorInput(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None

class VectorUpdate(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None

class SearchInput(BaseModel):
    text: str
    limit: int = 5

class CreateCollectionInput(BaseModel):
    name: str

@router.get("/collections", response_model=List[Dict])
async def list_collections():
    """Lista todas as coleções disponíveis no banco de vetores"""
    try:
        collections = VectorDBService.list_all_collections()
        return collections
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/collections", status_code=status.HTTP_201_CREATED)
async def create_collection(collection_input: CreateCollectionInput):
    """Cria uma nova coleção no banco de vetores"""
    try:
        # Sanitiza o nome da coleção
        import re
        sanitized_name = re.sub(r'[^a-zA-Z0-9_-]', '', collection_input.name.replace(' ', '_')).lower()
        
        if not sanitized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome da coleção inválido"
            )
        
        result = VectorDBService.create_collection_static(sanitized_name)
        return {
            "message": "Coleção criada com sucesso",
            "name": sanitized_name,
            "original_name": collection_input.name
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Deleta uma coleção do banco de vetores"""
    try:
        result = VectorDBService.delete_collection_static(collection_name)
        return {
            "message": "Coleção deletada com sucesso",
            "name": collection_name
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/context")
async def get_context(user: Optional[str] = None, collection: Optional[str] = None):
    """Retorna informações do contexto atual (usuário, coleção)"""
    try:
        db = get_db_service(user=user, collection=collection)
        return {
            "user": user,
            "collection": collection,
            "collection_name": db.collection_name
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[Dict])
async def get_all_vectors(user: Optional[str] = None, collection: Optional[str] = None):
    """Recupera todos os vetores armazenados (memórias)"""
    try:
        db = get_db_service(user=user, collection=collection)
        data = db.get_all_vectors()
        return data
    except Exception as e:
        status_code, detail = _parse_collection_error(e, user, collection)
        raise HTTPException(status_code=status_code, detail=detail)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_vector(vector_input: VectorInput, user: Optional[str] = None, collection: Optional[str] = None):
    """Adiciona um novo vetor (memória) gerando embedding automaticamente"""
    try:
        # Gera embedding usando Ollama
        embedding = ollama_service.generate_embedding(vector_input.text)
        
        # Salva no Qdrant
        db = get_db_service(user=user, collection=collection)
        point_id = db.add_vector(
            text=vector_input.text,
            vector=embedding,
            metadata=vector_input.metadata
        )
        
        return {
            "message": "Vector added successfully",
            "id": point_id,
            "text": vector_input.text,
            "collection": db.collection_name
        }
    except Exception as e:
        status_code, detail = _parse_collection_error(e, user, collection)
        raise HTTPException(status_code=status_code, detail=detail)

@router.put("/{vector_id}")
async def update_vector(vector_id: str, vector_update: VectorUpdate, user: Optional[str] = None, collection: Optional[str] = None):
    """Atualiza um vetor (memória) existente"""
    try:
        # Gera novo embedding para o texto atualizado
        embedding = ollama_service.generate_embedding(vector_update.text)
        
        # Atualiza no Qdrant
        db = get_db_service(user=user, collection=collection)
        success = db.update_vector(
            point_id=vector_id,
            text=vector_update.text,
            vector=embedding,
            metadata=vector_update.metadata
        )
        
        if success:
            return {
                "message": "Vector updated successfully",
                "id": vector_id,
                "text": vector_update.text,
                "collection": db.collection_name
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vector not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        status_code, detail = _parse_collection_error(e, user, collection)
        raise HTTPException(status_code=status_code, detail=detail)

def _parse_collection_error(error: Exception, user: Optional[str], collection: Optional[str]) -> tuple[int, str]:
    """Analisa o erro e retorna status code e mensagem amigável"""
    error_str = str(error)
    
    # Erro de coleção não encontrada
    if "doesn't exist" in error_str or "not found" in error_str.lower():
        # Tenta extrair o nome da coleção do erro
        db_temp = get_db_service(user=user, collection=collection)
        expected_collection = db_temp.collection_name
        
        # Lista coleções disponíveis para ajudar o usuário
        available_collections = VectorDBService.list_all_collections()
        collection_names = [c['name'] for c in available_collections]
        
        hint = ""
        if collection_names:
            hint = f"\n\nColeções disponíveis: {', '.join(collection_names[:5])}"
            if len(collection_names) > 5:
                hint += f" (e mais {len(collection_names) - 5})"
        
        return (
            status.HTTP_404_NOT_FOUND,
            f"Coleção '{expected_collection}' não encontrada. "
            f"Verifique se os parâmetros 'user' e 'collection' estão corretos. "
            f"Formato esperado: {{collection}}_{{user}}"
            f"{hint}"
        )
    
    # Erro de conexão com Qdrant
    if "connection" in error_str.lower() or "connect" in error_str.lower():
        return (
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Não foi possível conectar ao banco de vetores (Qdrant). Verifique se o serviço está rodando."
        )
    
    # Erro de conexão com Ollama
    if "ollama" in error_str.lower() or "embedding" in error_str.lower():
        return (
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Não foi possível gerar embeddings. Verifique se o Ollama está rodando e se o modelo 'nomic-embed-text' está disponível."
        )
    
    # Erro genérico
    return (status.HTTP_500_INTERNAL_SERVER_ERROR, f"Erro interno: {error_str}")


@router.post("/search", response_model=List[Dict])
async def search_vectors(search_input: SearchInput, user: Optional[str] = None, collection: Optional[str] = None):
    """Busca vetores (memórias) similares ao texto fornecido usando busca semântica"""
    try:
        # Gera embedding do texto de busca
        query_embedding = ollama_service.generate_embedding(search_input.text)
        
        # Busca vetores similares
        db = get_db_service(user=user, collection=collection)
        results = db.search_similar(query_embedding, limit=search_input.limit)
        
        return results
    except Exception as e:
        status_code, detail = _parse_collection_error(e, user, collection)
        raise HTTPException(status_code=status_code, detail=detail)

@router.delete("/{vector_id}")
async def delete_vector(vector_id: str, user: Optional[str] = None, collection: Optional[str] = None):
    """Remove um vetor (memória) pelo ID"""
    try:
        db = get_db_service(user=user, collection=collection)
        success = db.delete_vector(vector_id)
        
        if success:
            return {
                "message": "Vector deleted successfully",
                "id": vector_id,
                "collection": db.collection_name
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vector not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        status_code, detail = _parse_collection_error(e, user, collection)
        raise HTTPException(status_code=status_code, detail=detail)