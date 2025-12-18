from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import os
import uuid
import re

class VectorDBService:
    def __init__(self, user: Optional[str] = None, collection: Optional[str] = None, auto_create: bool = False):
        # Conecta ao Qdrant (usa localhost por padrão, Docker usa 'qdrant')
        qdrant_host = os.getenv("QDRANT_HOST", "localhost")
        qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))
        
        self.client = QdrantClient(host=qdrant_host, port=qdrant_port)
        self.collection_name = self._build_collection_name(collection, user)
        
        # Só cria automaticamente se explicitamente solicitado
        if auto_create:
            self._ensure_collection()
    
    def _sanitize_name(self, name: str) -> str:
        """Remove caracteres especiais e espaços do nome"""
        # Substitui espaços por underscore e remove caracteres não alfanuméricos
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', name.replace(' ', '_'))
        return sanitized.lower()
    
    def _build_collection_name(self, collection: Optional[str], user: Optional[str]) -> str:
        """Constrói o nome da coleção baseado em collection e user"""
        base_collection = self._sanitize_name(collection) if collection else "vectors"
        
        if user:
            sanitized_user = self._sanitize_name(user)
            return f"{base_collection}_{sanitized_user}"
        
        return base_collection
    
    def _ensure_collection(self):
        """Garante que a coleção existe"""
        collections = self.client.get_collections().collections
        if not any(col.name == self.collection_name for col in collections):
            # Cria coleção com 768 dimensões (tamanho do embedding do nomic-embed-text)
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
    
    def collection_exists(self) -> bool:
        """Verifica se a coleção existe"""
        collections = self.client.get_collections().collections
        return any(col.name == self.collection_name for col in collections)
    
    @staticmethod
    def create_collection_static(collection_name: str) -> Dict:
        """Cria uma nova coleção explicitamente"""
        qdrant_host = os.getenv("QDRANT_HOST", "localhost")
        qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))
        
        client = QdrantClient(host=qdrant_host, port=qdrant_port)
        
        # Verifica se já existe
        collections = client.get_collections().collections
        if any(col.name == collection_name for col in collections):
            raise ValueError(f"Coleção '{collection_name}' já existe")
        
        # Cria a coleção
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )
        
        return {"name": collection_name, "status": "created"}
    
    @staticmethod
    def delete_collection_static(collection_name: str) -> Dict:
        """Deleta uma coleção"""
        qdrant_host = os.getenv("QDRANT_HOST", "localhost")
        qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))
        
        client = QdrantClient(host=qdrant_host, port=qdrant_port)
        
        # Verifica se existe
        collections = client.get_collections().collections
        if not any(col.name == collection_name for col in collections):
            raise ValueError(f"Coleção '{collection_name}' não encontrada")
        
        # Deleta a coleção
        client.delete_collection(collection_name=collection_name)
        
        return {"name": collection_name, "status": "deleted"}
    
    @staticmethod
    def list_all_collections() -> List[Dict]:
        """Lista todas as coleções disponíveis no Qdrant"""
        qdrant_host = os.getenv("QDRANT_HOST", "localhost")
        qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))
        
        client = QdrantClient(host=qdrant_host, port=qdrant_port)
        collections = client.get_collections().collections
        
        result = []
        for col in collections:
            try:
                # Obtém informações da coleção
                info = client.get_collection(col.name)
                result.append({
                    "name": col.name,
                    "vectors_count": info.points_count,
                    "status": str(info.status)
                })
            except Exception:
                result.append({
                    "name": col.name,
                    "vectors_count": 0,
                    "status": "unknown"
                })
        
        return result
    
    def add_vector(self, text: str, vector: List[float], metadata: Optional[Dict] = None) -> str:
        """Adiciona um vetor à coleção"""
        point_id = str(uuid.uuid4())
        payload = {"text": text}
        if metadata:
            payload.update(metadata)
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            ]
        )
        return point_id
    
    def search_similar(self, vector: List[float], limit: int = 5) -> List[Dict]:
        """Busca vetores similares"""
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=vector,
            limit=limit
        )
        
        return [
            {
                "id": hit.id,
                "score": hit.score,
                "text": hit.payload.get("text", ""),
                "metadata": {k: v for k, v in hit.payload.items() if k != "text"}
            }
            for hit in results.points
        ]
    
    def get_all_vectors(self) -> List[Dict]:
        """Recupera todos os vetores"""
        try:
            points, _ = self.client.scroll(
                collection_name=self.collection_name,
                limit=100
            )
            
            return [
                {
                    "id": point.id,
                    "text": point.payload.get("text", ""),
                    "metadata": {k: v for k, v in point.payload.items() if k != "text"}
                }
                for point in points
            ]
        except Exception as e:
            print(f"Erro ao buscar vetores: {e}")
            return []
    
    def delete_vector(self, point_id: str) -> bool:
        """Remove um vetor"""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[point_id]
            )
            return True
        except Exception as e:
            print(f"Erro ao deletar vetor: {e}")
            return False
    
    def update_vector(self, point_id: str, text: str, vector: List[float], metadata: Optional[Dict] = None) -> bool:
        """Atualiza um vetor existente"""
        try:
            payload = {"text": text}
            if metadata:
                payload.update(metadata)
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )
            return True
        except Exception as e:
            print(f"Erro ao atualizar vetor: {e}")
            return False

# Funções de compatibilidade com a API antiga
# Cache de serviços por coleção
_db_services: Dict[str, VectorDBService] = {}

def get_db_service(user: Optional[str] = None, collection: Optional[str] = None, auto_create: bool = False) -> VectorDBService:
    """Obtém ou cria uma instância do VectorDBService para a coleção especificada"""
    # Cria uma chave única para o cache baseada em user e collection
    cache_key = f"{collection or 'vectors'}_{user or 'default'}"
    
    if cache_key not in _db_services:
        _db_services[cache_key] = VectorDBService(user=user, collection=collection, auto_create=auto_create)
    
    return _db_services[cache_key]

def read_vector_data() -> List[Dict]:
    """Lê todos os vetores armazenados"""
    return get_db_service().get_all_vectors()

def write_vector_data(vector: Dict) -> None:
    """Escreve um novo vetor no armazenamento"""
    # Esta função agora precisa do texto e do embedding
    # Por enquanto, mantém compatibilidade básica
    db = get_db_service()
    text = vector.get("text", "")
    embedding = vector.get("embedding", [])
    metadata = {k: v for k, v in vector.items() if k not in ["text", "embedding"]}
    
    if text and embedding:
        db.add_vector(text, embedding, metadata)