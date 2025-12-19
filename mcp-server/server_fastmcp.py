#!/usr/bin/env python3
"""
MCP Server para Vector Database usando FastMCP com suporte HTTP/SSE
Expõe ferramentas para gerenciar vetores e fazer buscas semânticas
Acesse via: http://localhost:8000/sse?user=patrick&collection=memorias
"""

import json
import sys
import os
import logging
from typing import Any, Dict, Optional
import asyncio

# Configura logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Adiciona o backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src'))

from fastmcp import FastMCP
from services.vector_db_service import get_db_service
from services.ollama_service import OllamaService

# Configurações do servidor HTTP
HOST = os.getenv("MCP_HOST", "0.0.0.0")
PORT = int(os.getenv("MCP_PORT", "8000"))

# Configurações de usuário e coleção (podem ser definidas via variáveis de ambiente)
DEFAULT_USER = os.getenv("MCP_USER", None)
DEFAULT_COLLECTION = os.getenv("MCP_COLLECTION", None)

# Contexto de sessão - armazena user/collection para a sessão atual
# Em um cenário multi-cliente real, isso deveria ser por conexão/sessão
_session_context: Dict[str, Optional[str]] = {
    "user": None,
    "collection": None
}

def get_effective_user(user: Optional[str] = None) -> Optional[str]:
    """Retorna o usuário efetivo: parâmetro > contexto de sessão > padrão do ambiente"""
    return user or _session_context.get("user") or DEFAULT_USER

def get_effective_collection(collection: Optional[str] = None) -> Optional[str]:
    """Retorna a coleção efetiva: parâmetro > contexto de sessão > padrão do ambiente"""
    return collection or _session_context.get("collection") or DEFAULT_COLLECTION

# Inicializa o servidor FastMCP com configuração HTTP
mcp = FastMCP(
    "vector-db-mcp",
   
)

# Serviços (lazy loading)
_ollama_service = None


def get_ollama_service() -> OllamaService:
    """Obtém instância do serviço Ollama (lazy loading)"""
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service


@mcp.tool()
def add_vector(text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """
    Adiciona um novo texto ao banco de vetores (memoria). O embedding é gerado automaticamente.
    Usa o contexto de user/collection definido na URL de conexão.
    
    Args:
        text: O texto a ser armazenado
        metadata: Metadados opcionais
    
    Returns:
        JSON com resultado da operação
    """
    try:
        logger.info(f"Executando ferramenta: add_vector")
        
        # Usa apenas o contexto de sessão (URL params)
        effective_user = get_effective_user()
        effective_collection = get_effective_collection()
        
        if metadata is None:
            metadata = {}
        
        ollama = get_ollama_service()
        embedding = ollama.generate_embedding(text)
        # Ao adicionar vetor, garante que a coleção exista (auto_create=True)
        db = get_db_service(user=effective_user, collection=effective_collection, auto_create=True)
        vector_id = db.add_vector(text=text, vector=embedding, metadata=metadata)
        
        return json.dumps({
            "success": True,
            "id": vector_id,
            "message": "Vetor adicionado com sucesso",
            "text": text,
            "collection": db.collection_name
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Erro ao adicionar vetor: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
def search_vectors(text: str, limit: int = 5) -> str:
    """
    Busca vetores (memoria) similares usando busca semântica.
    Usa o contexto de user/collection definido na URL de conexão.
    
    Args:
        text: Texto de consulta
        limit: Número máximo de resultados (default: 5)
    
    Returns:
        JSON com resultados da busca
    """
    try:
        logger.info(f"Executando ferramenta: search_vectors")
        
        # Usa apenas o contexto de sessão (URL params)
        effective_user = get_effective_user()
        effective_collection = get_effective_collection()
        
        ollama = get_ollama_service()
        query_embedding = ollama.generate_embedding(text)
        db = get_db_service(user=effective_user, collection=effective_collection, auto_create=True)
        results = db.search_similar(query_embedding, limit=limit)
        
        return json.dumps({
            "success": True,
            "query": text,
            "collection": db.collection_name,
            "results_count": len(results),
            "results": results
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Erro ao buscar vetores: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
def list_all_vectors() -> str:
    """
    Lista todos os vetores armazenados (memoria).
    Usa o contexto de user/collection definido na URL de conexão.
    
    Returns:
        JSON com todos os vetores
    """
    try:
        logger.info(f"Executando ferramenta: list_all_vectors")
        
        # Usa apenas o contexto de sessão (URL params)
        effective_user = get_effective_user()
        effective_collection = get_effective_collection()
        
        db = get_db_service(user=effective_user, collection=effective_collection, auto_create=True)
        vectors = db.get_all_vectors()
        
        return json.dumps({
            "success": True,
            "collection": db.collection_name,
            "count": len(vectors),
            "vectors": vectors
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Erro ao listar vetores: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
def delete_vector(vector_id: str) -> str:
    """
    Remove um vetor pelo ID (memoria).
    Usa o contexto de user/collection definido na URL de conexão.
    
    Args:
        vector_id: ID do vetor a ser removido
    
    Returns:
        JSON com resultado da operação
    """
    try:
        logger.info(f"Executando ferramenta: delete_vector")
        
        # Usa apenas o contexto de sessão (URL params)
        effective_user = get_effective_user()
        effective_collection = get_effective_collection()
        
        db = get_db_service(user=effective_user, collection=effective_collection, auto_create=True)
        success = db.delete_vector(vector_id)
        
        return json.dumps({
            "success": success,
            "collection": db.collection_name,
            "message": f"Vetor {'removido' if success else 'não encontrado'}"
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Erro ao deletar vetor: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


def main():
    """Inicia o servidor MCP com FastMCP via HTTP/SSE com suporte a query params"""
    import uvicorn
    from starlette.applications import Starlette
    from starlette.routing import Mount, Route
    from starlette.requests import Request
    from starlette.responses import Response
    from mcp.server.sse import SseServerTransport
    
    # Cria o transporte SSE
    sse = SseServerTransport("/messages/")
    
    async def handle_sse(request: Request):
        """Handler SSE que extrai user e collection da query string"""
        # Extrai parâmetros da URL
        user = request.query_params.get("user")
        collection = request.query_params.get("collection")
        
        # Configura o contexto de sessão com os parâmetros da URL
        if user:
            _session_context["user"] = user
            logger.info(f"Contexto configurado via URL - user: {user}")
        if collection:
            _session_context["collection"] = collection
            logger.info(f"Contexto configurado via URL - collection: {collection}")
        
        # Log do nome efetivo da coleção
        effective_user = get_effective_user()
        effective_collection = get_effective_collection()
        if effective_user or effective_collection:
            db = get_db_service(user=effective_user, collection=effective_collection)
            logger.info(f"Coleção efetiva: {db.collection_name}")
        
        # Processa a conexão SSE
        async with sse.connect_sse(
            request.scope, request.receive, request._send
        ) as streams:
            await mcp._mcp_server.run(
                streams[0], streams[1], mcp._mcp_server.create_initialization_options()
            )
        
        return Response()
    
    async def handle_messages(request: Request):
        """Handler para mensagens POST"""
        await sse.handle_post_message(request.scope, request.receive, request._send)
        return Response()
    
    # Cria a aplicação Starlette
    app = Starlette(
        debug=True,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Route("/messages/", endpoint=handle_messages, methods=["POST"]),
        ],
    )
    
    logger.info(f"Iniciando MCP Server com FastMCP em http://{HOST}:{PORT}")
    logger.info(f"Endpoint SSE: http://{HOST}:{PORT}/sse")
    logger.info(f"Endpoint SSE com params: http://{HOST}:{PORT}/sse?user=SEU_USER&collection=SUA_COLECAO")
    logger.info(f"Endpoint Messages: http://{HOST}:{PORT}/messages/")
    if DEFAULT_USER:
        logger.info(f"Usuário padrão (env): {DEFAULT_USER}")
    if DEFAULT_COLLECTION:
        logger.info(f"Coleção padrão (env): {DEFAULT_COLLECTION}")
    
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
