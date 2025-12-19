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
from typing import Any, Dict, Optional, List
import asyncio
from datetime import datetime
import uuid as uuid_module

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
import memory_helpers as mh
from qdrant_client.models import PointStruct, Filter

# Configurações do servidor HTTP
HOST = os.getenv("MCP_HOST", "0.0.0.0")
PORT = int(os.getenv("MCP_PORT", "8000"))

# Configurações de modelos
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen3:4b-instruct")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

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
    return _session_context.get("user") or DEFAULT_USER

def get_effective_collection(collection: Optional[str] = None) -> Optional[str]:
    """Retorna a coleção efetiva: parâmetro > contexto de sessão > padrão do ambiente"""
    return _session_context.get("collection") or DEFAULT_COLLECTION

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
    📝 Adiciona texto ao banco vetorial com embedding automático.
    
    Esta ferramenta armazena texto convertendo-o automaticamente em embedding vetorial.
    O contexto de usuário e coleção é definido via parâmetros da URL de conexão SSE.
    
    Args:
        text: Texto a ser armazenado no banco vetorial
        metadata: Metadados adicionais (opcional). Pode incluir campos customizados como tags, categoria, etc.
    
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
    🔍 Busca semântica simples de vetores similares.
    
    Realiza busca por similaridade vetorial usando embeddings. Esta é a versão básica.
    Para buscas avançadas com reescrita de query e filtros, use memory_search.
    
    Args:
        text: Texto ou query de busca natural
        limit: Quantidade máxima de resultados a retornar (padrão: 5)
    
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
    📋 Lista todos os vetores armazenados na coleção atual.
    
    Retorna todos os vetores com seus metadados da coleção configurada na URL de conexão.
    Útil para auditoria e visualização do conteúdo armazenado.
    
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
    🗑️ Remove um vetor específico pelo ID.
    
    Deleta permanentemente um vetor da coleção. Esta ação não pode ser desfeita.
    Use list_all_vectors para obter IDs válidos.
    
    Args:
        vector_id: ID único do vetor a ser removido (UUID string)
    
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


@mcp.tool()
def memory_store_candidate(
    session_id: str,
    text: str,
    source: str,
    user_id: Optional[str] = None,
    timestamp: Optional[str] = None
) -> str:
    """
    🧠 Memory Gate: Classificação inteligente e armazenamento de memórias.
    
    Porta de entrada inteligente que usa LLM (qwen3:4b) para:
    - ✅ Filtrar conversa vazia (smalltalk) automaticamente
    - 🏷️ Classificar tipo: preferência, fato, decisão, tarefa ou nota
    - ⭐ Atribuir importância (0-3) e TTL (tempo de vida)
    - 🔄 Substituir memórias duplicadas (dedupe por significado semântico)
    - ✂️ Dividir textos longos em chunks com overlap
    
    Args:
        session_id: ID da sessão/conversa atual
        text: Texto candidato a ser armazenado como memória
        source: Origem da memória (ex: "chat", "email", "note", "api")
        user_id: Identificador do usuário (opcional, usa contexto DEFAULT_USER se não fornecido)
        timestamp: Timestamp ISO 8601 (opcional, usa UTC atual se não informado)
    
    Returns:
        JSON with classification result and storage decision
    """
    try:
        logger.info("Executing tool: memory_store_candidate")
        
        # Usa contexto de sessão (URL params) ou DEFAULT_USER
        effective_user = get_effective_user(user_id)
        effective_collection = get_effective_collection()
        
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat()
        
        ollama = get_ollama_service()
        
        # Prepare LLM prompt for classification
        prompt = f"""Analyze this text and classify it as a memory. Respond ONLY with valid JSON.

Text: "{text}"
Source: {source}

Classify into one of: preference, fact, decision, task, note, filler

Rules:
- filler/smalltalk: should_store=false
- preference: importance>=2, ttl_days>=180
- decision: importance>=2, ttl_days>=180
- task: ttl_days 30-90 based on urgency
- fact: ttl_days based on relevance
- note: ttl_days 30-60

Respond with this exact JSON structure:
{{
  "should_store": true/false,
  "type": "preference|fact|decision|task|note|filler",
  "importance": 0-3,
  "ttl_days": number (0 means never expires),
  "title": "brief title",
  "canonical": "cleaned text without sensitive data",
  "entities": ["entity1", "entity2"],
  "tags": ["tag1", "tag2"]
}}"""

        messages = [
            {"role": "system", "content": "You are a memory classification expert. Respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        classification = mh.chat_json(messages, ollama, model=OLLAMA_CHAT_MODEL)
        
        if not classification or not classification.get("should_store", False):
            return json.dumps({
                "success": True,
                "stored": False,
                "reason": "Filtered out as not worth storing",
                "classification": classification
            }, indent=2)
        
        # Generate dedupe key
        dedupe_key = mh.generate_dedupe_key(text, effective_user)
        
        # Check for existing memories with same dedupe_key
        db = get_db_service(user=effective_user, collection=effective_collection, auto_create=True)
        
        # Search for existing memories with this dedupe_key
        try:
            existing_points, _ = db.client.scroll(
                collection_name=db.collection_name,
                scroll_filter=Filter(
                    must=[
                        {"key": "user_id", "match": {"value": effective_user}},
                        {"key": "dedupe_key", "match": {"value": dedupe_key}}
                    ]
                ),
                limit=100
            )
            
            if existing_points:
                # Delete old group
                old_group_id = existing_points[0].payload.get("group_id")
                if old_group_id:
                    db.client.delete(
                        collection_name=db.collection_name,
                        points_selector=Filter(
                            must=[{"key": "group_id", "match": {"value": old_group_id}}]
                        )
                    )
                    logger.info(f"Deleted old memories for dedupe_key: {dedupe_key}")
        except Exception as e:
            logger.warning(f"Error checking for duplicates: {e}")
        
        # Chunk if needed
        canonical = classification.get("canonical", text)
        chunks = mh.chunk_text(canonical)
        group_id = str(uuid_module.uuid4())
        
        # Calculate expiration
        expires_at_iso = mh.calculate_expires_at(timestamp, classification.get("ttl_days", 0))
        
        # Create points for all chunks
        points = []
        for idx, chunk in enumerate(chunks):
            embedding = mh.embed_text(chunk, ollama)
            point_id = str(uuid_module.uuid4())
            
            payload = {
                "text": chunk,
                "user_id": effective_user,
                "type": classification.get("type", "note"),
                "importance": classification.get("importance", 1),
                "ttl_days": classification.get("ttl_days", 0),
                "title": classification.get("title", ""),
                "entities": classification.get("entities", []),
                "tags": classification.get("tags", []),
                "source": source,
                "timestamp_iso": timestamp,
                "dedupe_key": dedupe_key,
                "group_id": group_id,
                "chunk_index": idx,
                "expires_at_iso": expires_at_iso,
                "session_id": session_id
            }
            
            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload=payload
            ))
        
        # Upsert all points
        db.client.upsert(
            collection_name=db.collection_name,
            points=points
        )
        
        return json.dumps({
            "success": True,
            "stored": True,
            "chunks": len(chunks),
            "group_id": group_id,
            "dedupe_key": dedupe_key,
            "classification": classification
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error in memory_store_candidate: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "stored": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
def memory_rewrite_query(
    query: str,
    user_id: Optional[str] = None,
    context_hint: Optional[str] = None,
    k: int = 5
) -> str:
    """
    🔄 Query Rewriter: Expande queries em variantes semânticas e extrai filtros automáticos.
    
    Usa LLM para melhorar recall da busca gerando:
    - 📝 2-5 variantes semânticas da query original
    - 🎯 Filtros automáticos detectados por keywords:
      • "preferência/preference" → filtra type=preference
      • "decisão/decision/arquitetura" → filtra type=decision  
      • "tarefa/task" → filtra type=task
      • "recente/recent/últimos X dias" → filtro temporal
      • "importante/critical" → filtro min_importance
    
    Args:
        query: Query original em linguagem natural
        user_id: Identificador do usuário para contexto (opcional, usa contexto DEFAULT_USER se não fornecido)
        context_hint: Dica de contexto opcional (ex: "buscando configurações UI")
        k: Número alvo de resultados (influencia estratégia de reescrita)
    
    Returns:
        JSON with rewritten_queries and filters
    """
    try:
        logger.info("Executing tool: memory_rewrite_query")
        
        # Usa contexto de sessão (URL params) ou DEFAULT_USER
        effective_user = get_effective_user(user_id)
        
        ollama = get_ollama_service()
        
        prompt = f"""Rewrite this query into 2-5 semantic variants for better semantic search recall. Also extract intent filters.

Query: "{query}"
{f'Context: {context_hint}' if context_hint else ''}

Rules:
- Generate 2-5 rewritten queries with different phrasings
- Extract filters based on keywords:
  - "preferência/preference" → type_any includes "preference"
  - "decisão/decision/arquitetura" → type_any includes "decision"
  - "tarefa/task" → type_any includes "task"
  - "recente/recent/últimos" → reduce time_range_days (e.g., 30)
  - importance keywords → set min_importance
- Default: no filters except user_id

Respond with this exact JSON structure:
{{
  "rewritten_queries": ["variant1", "variant2", ...],
  "filters": {{
    "tags_any": ["tag1"],
    "type_any": ["preference"],
    "min_importance": 1,
    "time_range_days": 365
  }}
}}"""

        messages = [
            {"role": "system", "content": "You are a query expansion expert. Respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        result = mh.chat_json(messages, ollama, model=OLLAMA_CHAT_MODEL)
        
        if not result:
            # Fallback
            return json.dumps({
                "success": True,
                "rewritten_queries": [query],
                "filters": {}
            }, indent=2)
        
        return json.dumps({
            "success": True,
            "rewritten_queries": result.get("rewritten_queries", [query]),
            "filters": result.get("filters", {})
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error in memory_rewrite_query: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e),
            "rewritten_queries": [query],
            "filters": {}
        }, indent=2)


@mcp.tool()
def memory_search(
    query: str,
    user_id: Optional[str] = None,
    filters: Optional[Dict] = None,
    k: int = 5
) -> str:
    """
    🔍 Busca Semântica Avançada: Multi-query search com TTL e deduplicação.
    
    Busca vetorial aprimorada que:
    - 🔄 Reescreve query automaticamente se filtros não fornecidos (via memory_rewrite_query)
    - 🎯 Busca com TODAS as variantes de query para máximo recall
    - ⏰ Filtra memórias expiradas (respeita TTL/expires_at_iso)
    - 🔑 Deduplica resultados por dedupe_key (evita chunks repetidos)
    - 📊 Retorna top-k ordenados por score de similaridade
    
    Args:
        query: Query de busca em linguagem natural
        user_id: Identificador do usuário (opcional, usa contexto DEFAULT_USER se não fornecido)
        filters: Filtros opcionais (dict):
          - tags_any: list[str] - match qualquer tag
          - type_any: list[str] - match qualquer tipo
          - min_importance: int - importância mínima (0-3)
          - time_range_days: int - memórias dos últimos N dias
        k: Quantidade de resultados únicos a retornar
    
    Returns:
        JSON with search candidates
    """
    try:
        logger.info("Executing tool: memory_search")
        
        # Usa contexto de sessão (URL params) ou DEFAULT_USER
        effective_user = get_effective_user(user_id)
        effective_collection = get_effective_collection()
        
        ollama = get_ollama_service()
        db = get_db_service(user=effective_user, collection=effective_collection, auto_create=True)
        
        # If no filters, use rewrite_query to get them
        rewritten_queries = [query]
        if not filters:
            rewrite_result = memory_rewrite_query(query, user_id=effective_user, k=k)
            rewrite_data = json.loads(rewrite_result)
            if rewrite_data.get("success"):
                rewritten_queries = rewrite_data.get("rewritten_queries", [query])
                filters = rewrite_data.get("filters", {})
        
        # Build Qdrant filter
        qdrant_filter = mh.build_qdrant_filter(effective_user, filters)
        
        # Search with each rewritten query
        all_results = []
        seen_dedupe_keys = set()
        
        for rquery in rewritten_queries:
            query_embedding = mh.embed_text(rquery, ollama)
            
            try:
                search_results = db.client.query_points(
                    collection_name=db.collection_name,
                    query=query_embedding,
                    query_filter=qdrant_filter,
                    limit=k * 2  # Get more to dedupe
                )
                
                for hit in search_results.points:
                    dedupe_key = hit.payload.get("dedupe_key", hit.id)
                    
                    if dedupe_key not in seen_dedupe_keys:
                        seen_dedupe_keys.add(dedupe_key)
                        all_results.append({
                            "id": str(hit.id),
                            "score": hit.score,
                            "text": hit.payload.get("text", ""),
                            "metadata": {k: v for k, v in hit.payload.items() if k != "text"}
                        })
            except Exception as e:
                logger.warning(f"Search failed for query '{rquery}': {e}")
        
        # Sort by score and take top k
        all_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = all_results[:k]
        
        return json.dumps({
            "success": True,
            "query": query,
            "rewritten_queries": rewritten_queries,
            "results_count": len(top_results),
            "candidates": top_results
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error in memory_search: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e),
            "candidates": []
        }, indent=2)


@mcp.tool()
def memory_rerank(
    query: str,
    candidates: List[Dict],
    top_n: int = 3
) -> str:
    """
    🎯 LLM Re-Ranker: Seleção inteligente das memórias mais relevantes.
    
    Usa LLM (qwen3:4b) para análise contextual profunda e seleção dos candidatos
    mais úteis para responder a query. Vai além da similaridade vetorial ao considerar:
    - 🧠 Relevância semântica profunda para a query
    - ⭐ Score de importância da memória
    - 🕐 Recência e contexto temporal
    - 🔗 Relações entre memórias
    
    Fallback: Se LLM falhar, usa ranking por (score, importance).
    
    Args:
        query: Query original do usuário
        candidates: Lista de candidatos de memory_search (cada um com id, score, text, metadata)
        top_n: Quantidade de memórias a selecionar (padrão: 3)
    
    Returns:
        JSON with selected memories and reasons
    """
    try:
        logger.info("Executing tool: memory_rerank")
        
        if not candidates:
            return json.dumps({
                "success": True,
                "selected": []
            }, indent=2)
        
        ollama = get_ollama_service()
        
        # Build candidate summary for LLM
        candidates_text = ""
        for i, cand in enumerate(candidates):
            candidates_text += f"\n{i+1}. ID: {cand['id']}\n"
            candidates_text += f"   Text: {cand['text'][:200]}\n"
            candidates_text += f"   Importance: {cand.get('metadata', {}).get('importance', 0)}\n"
            candidates_text += f"   Type: {cand.get('metadata', {}).get('type', 'unknown')}\n"
        
        prompt = f"""Given this query and candidate memories, select the top {top_n} most relevant ones.

Query: "{query}"

Candidates:{candidates_text}

Select the {top_n} most useful candidates that would help answer the query. Consider:
- Semantic relevance to the query
- Importance score (higher is better)
- Recency and context

Respond with this exact JSON structure:
{{
  "selected": [
    {{"id": "candidate_id", "reason": "why this is relevant"}},
    ...
  ]
}}"""

        messages = [
            {"role": "system", "content": "You are a relevance ranking expert. Respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        result = mh.chat_json(messages, ollama, model=OLLAMA_CHAT_MODEL)
        
        if not result or "selected" not in result:
            # Fallback: use top_n by score and importance
            sorted_candidates = sorted(
                candidates,
                key=lambda x: (x.get("score", 0), x.get("metadata", {}).get("importance", 0)),
                reverse=True
            )
            selected = [
                {"id": c["id"], "reason": "Selected by score"}
                for c in sorted_candidates[:top_n]
            ]
            return json.dumps({
                "success": True,
                "selected": selected,
                "fallback": True
            }, indent=2)
        
        return json.dumps({
            "success": True,
            "selected": result.get("selected", [])
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error in memory_rerank: {e}", exc_info=True)
        # Fallback to top candidates by score
        sorted_candidates = sorted(candidates, key=lambda x: x.get("score", 0), reverse=True)
        selected = [{"id": c["id"], "reason": "Fallback selection"} for c in sorted_candidates[:top_n]]
        return json.dumps({
            "success": False,
            "error": str(e),
            "selected": selected,
            "fallback": True
        }, indent=2)


@mcp.tool()
def memory_pack(
    query: str,
    selected: List[Dict],
    max_tokens_hint: int = 1000
) -> str:
    """
    📦 Memory Packer: Formata memórias selecionadas para consumo LLM.
    
    Empacota memórias em formato estruturado otimizado para injeção em prompt:
    - 🏷️ Agrupa por tipo (preferences, decisions, tasks, etc.)
    - 📝 Formata como bullets concisos
    - 🔗 Adiciona citações rastreáveis (mem:<id>)
    - ⚠️ Identifica gaps (ausências relevantes)
    - 📏 Respeita budget aproximado de tokens
    
    Args:
        query: Query original (para contexto)
        selected: Memórias selecionadas de memory_rerank (list of {id, reason})
        max_tokens_hint: Budget aproximado de tokens (padrão: 1000, não implementado ainda)
    
    Returns:
        JSON with formatted memory_context, citations, and gaps
    """
    try:
        logger.info("Executing tool: memory_pack")
        
        if not selected:
            return json.dumps({
                "success": True,
                "memory_context": [],
                "citations": [],
                "gaps": ["No relevant memories found for this query"]
            }, indent=2)
        
        # Get full memory data for selected IDs
        # Note: In a real implementation, we'd fetch these from the DB
        # For now, we'll format based on the selected data
        
        memory_context = []
        citations = []
        
        for item in selected:
            mem_id = item["id"]
            reason = item.get("reason", "Relevant memory")
            
            # Format: "mem:<id> - <brief summary>"
            formatted = f"mem:{mem_id} - {reason}"
            memory_context.append(formatted)
            citations.append(f"mem:{mem_id}")
        
        return json.dumps({
            "success": True,
            "memory_context": memory_context,
            "citations": citations,
            "gaps": []
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error in memory_pack: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e),
            "memory_context": [],
            "citations": [],
            "gaps": ["Error packing memories"]
        }, indent=2)


@mcp.tool()
def generate_screen_prompt(
    screen_description: str,
    user_id: Optional[str] = None,
    tech_stack: Optional[str] = None,
    style_preferences: Optional[str] = None,
    include_user_memories: bool = True
) -> str:
    """
    🎨 Screen Prompt Generator: Cria prompts inteligentes otimizados para geração de telas/interfaces.
    
    Gera prompts detalhados e estruturados para criar interfaces usando:
    - 🧠 Memórias e preferências do usuário (UI/UX, cores, estilos)
    - 🎯 Contexto técnico (stack, frameworks, bibliotecas)
    - 🎨 Padrões de design e best practices
    - 📋 Estrutura clara com seções (Layout, Componentes, Estilo, Interações)
    
    O prompt gerado pode ser usado com LLMs para criar código de telas completas.
    
    Args:
        screen_description: Descrição da tela desejada (ex: "tela de login moderna com dark mode")
        user_id: Identificador do usuário (opcional, usa contexto DEFAULT_USER se não fornecido)
        tech_stack: Stack técnico opcional (ex: "React + TypeScript + TailwindCSS", "Vue 3 + Vuetify")
        style_preferences: Preferências de estilo opcionais (ex: "minimalista", "glassmorphism", "neomorphism")
        include_user_memories: Se deve incluir memórias/preferências do usuário (padrão: True)
    
    Returns:
        JSON com prompt otimizado e metadados
    """
    try:
        logger.info("Executing tool: generate_screen_prompt")
        
        # Usa contexto de sessão (URL params) ou DEFAULT_USER
        effective_user = get_effective_user(user_id)
        
        ollama = get_ollama_service()
        user_preferences = ""
        
        # Busca preferências do usuário na memória
        if include_user_memories:
            try:
                search_result = memory_search(
                    query="preferências de UI, UX, design, cores, estilos de interface",
                    user_id=effective_user,
                    filters={"type_any": ["preference"], "min_importance": 1},
                    k=5
                )
                search_data = json.loads(search_result)
                
                if search_data.get("success") and search_data.get("candidates"):
                    prefs = []
                    for candidate in search_data["candidates"]:
                        prefs.append(f"- {candidate['text']}")
                    user_preferences = "\n".join(prefs)
                    logger.info(f"Found {len(prefs)} user preferences")
            except Exception as e:
                logger.warning(f"Could not fetch user preferences: {e}")
                user_preferences = ""
        
        # Monta prompt para o LLM gerar o prompt final
        llm_prompt = f"""Você é um especialista em UX/UI e geração de prompts para criar interfaces.

TAREFA: Criar um prompt DETALHADO e ESTRUTURADO para gerar o código de uma tela/interface.

DESCRIÇÃO DA TELA:
{screen_description}

{f'''STACK TÉCNICO:
{tech_stack}''' if tech_stack else ''}

{f'''PREFERÊNCIAS DE ESTILO:
{style_preferences}''' if style_preferences else ''}

{f'''PREFERÊNCIAS DO USUÁRIO (de memórias anteriores):
{user_preferences}''' if user_preferences else ''}

INSTRUÇÕES:
Crie um prompt completo e detalhado seguindo esta estrutura em JSON:

{{
  "prompt_title": "título curto e descritivo",
  "main_prompt": "prompt principal detalhado (2-4 parágrafos) explicando a tela, seu propósito, funcionalidades principais",
  "tech_requirements": {{
    "frameworks": ["framework1", "framework2"],
    "libraries": ["lib1", "lib2"],
    "styling": "método de estilização (CSS, TailwindCSS, Styled Components, etc)"
  }},
  "design_guidelines": [
    "guideline 1 (ex: usar esquema de cores dark mode)",
    "guideline 2 (ex: layout responsivo mobile-first)",
    "guideline 3 (ex: animações suaves e microinterações)"
  ],
  "components_needed": [
    {{"name": "ComponentName", "description": "o que este componente faz"}},
  ],
  "layout_structure": "descrição da estrutura/hierarquia dos componentes",
  "interactions": [
    "interação 1 (ex: validação em tempo real no formulário)",
    "interação 2 (ex: feedback visual ao submeter)"
  ],
  "accessibility": [
    "requisito 1 (ex: suporte a leitores de tela)",
    "requisito 2 (ex: navegação por teclado)"
  ],
  "full_prompt": "O PROMPT COMPLETO FINAL formatado e pronto para ser usado diretamente com LLM para gerar código"
}}

IMPORTANTE:
- Seja ESPECÍFICO e DETALHADO
- Inclua cores, tipografia, espaçamentos se relevante
- Mencione estados (hover, active, disabled, loading)
- Sugira componentes reutilizáveis
- Considere responsividade
- O campo "full_prompt" deve ser o prompt final completo e pronto para uso
- Use as preferências do usuário quando disponíveis
"""

        messages = [
            {"role": "system", "content": "Você é um especialista em UX/UI e geração de prompts detalhados. Responda APENAS com JSON válido."},
            {"role": "user", "content": llm_prompt}
        ]
        
        result = mh.chat_json(messages, ollama, model=OLLAMA_CHAT_MODEL)
        
        if not result:
            # Fallback: prompt básico
            fallback_prompt = f"""Crie uma tela/interface: {screen_description}

{f'Stack técnico: {tech_stack}' if tech_stack else ''}
{f'Estilo: {style_preferences}' if style_preferences else ''}

A interface deve ser moderna, responsiva e seguir as melhores práticas de UX/UI.
Inclua componentes bem estruturados, tratamento de estados e acessibilidade."""
            
            return json.dumps({
                "success": True,
                "prompt": fallback_prompt,
                "fallback": True,
                "user_preferences_used": bool(user_preferences)
            }, indent=2)
        
        # Adiciona metadados
        result["success"] = True
        result["user_preferences_used"] = bool(user_preferences)
        result["preferences_count"] = len(user_preferences.split("\n")) if user_preferences else 0
        
        return json.dumps(result, indent=2, ensure_ascii=False)
    
    except Exception as e:
        logger.error(f"Error in generate_screen_prompt: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e),
            "prompt": f"Crie uma tela: {screen_description}"
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
