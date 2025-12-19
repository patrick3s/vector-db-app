#!/usr/bin/env python3
"""
Memory Helpers - Core utilities for advanced memory management
"""

import json
import hashlib
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Model configuration
OLLAMA_CHAT_MODEL = "qwen3:4b-instruct"
OLLAMA_EMBED_MODEL = "nomic-embed-text"

# Chunking configuration
MAX_CHUNK_SIZE = 600
CHUNK_OVERLAP = 80
CHUNK_THRESHOLD = 800


def chunk_text(text: str) -> List[str]:
    """
    Splits text >800 chars into 600-char chunks with 80-char overlap.
    
    Args:
        text: Input text to chunk
    
    Returns:
        List of text chunks
    """
    if len(text) <= CHUNK_THRESHOLD:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + MAX_CHUNK_SIZE
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - CHUNK_OVERLAP
    
    return chunks


def embed_text(text: str, ollama_service) -> List[float]:
    """
    Wrapper for generating embeddings using Ollama.
    
    Args:
        text: Text to embed
        ollama_service: OllamaService instance
    
    Returns:
        Embedding vector
    """
    return ollama_service.generate_embedding(text)


def chat_json(messages: List[Dict], ollama_service, model: str = OLLAMA_CHAT_MODEL) -> Optional[Dict]:
    """
    LLM chat wrapper that enforces JSON responses.
    
    Args:
        messages: Chat messages
        ollama_service: OllamaService instance
        model: Model to use (default: qwen3:4b-instruct)
    
    Returns:
        Parsed JSON response or None if invalid
    """
    try:
        # Add system message to enforce JSON output if not present
        if not messages or messages[0].get("role") != "system":
            messages = [
                {"role": "system", "content": "You must respond with valid JSON only. No explanations, no markdown, just pure JSON."}
            ] + messages
        else:
            # Ensure system message emphasizes JSON
            messages[0]["content"] += "\n\nYou must respond with valid JSON only."
        
        response = ollama_service.generate_chat(messages, model=model)
        return validate_json_response(response)
    except Exception as e:
        logger.error(f"Error in chat_json: {e}")
        return None


def validate_json_response(response: str) -> Optional[Dict]:
    """
    Validates and parses JSON responses from LLM.
    
    Args:
        response: Raw LLM response
    
    Returns:
        Parsed JSON dict or None if invalid
    """
    try:
        # Try direct parsing
        return json.loads(response)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        if "```json" in response:
            try:
                json_str = response.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            except (IndexError, json.JSONDecodeError):
                pass
        
        # Try to extract JSON from curly braces
        if "{" in response and "}" in response:
            try:
                start = response.index("{")
                end = response.rindex("}") + 1
                json_str = response[start:end]
                return json.loads(json_str)
            except (ValueError, json.JSONDecodeError):
                pass
        
        logger.error(f"Failed to parse JSON from response: {response[:200]}")
        return None


def build_qdrant_filter(user_id: str, filters: Optional[Dict] = None) -> Dict:
    """
    Builds Qdrant filter with TTL, tags, type, importance constraints.
    
    Args:
        user_id: User ID to filter by
        filters: Optional additional filters with keys:
            - tags_any: List[str] - match any of these tags
            - type_any: List[str] - match any of these types
            - min_importance: int - minimum importance score
            - time_range_days: int - only memories from last N days
    
    Returns:
        Qdrant filter dict
    """
    now = datetime.utcnow().isoformat()
    
    # Build must conditions
    must_conditions = [
        {"key": "user_id", "match": {"value": user_id}}
    ]
    
    # TTL filter - only return non-expired memories
    # expires_at_iso == "never" OR expires_at_iso >= now
    must_conditions.append({
        "should": [
            {"key": "expires_at_iso", "match": {"value": "never"}},
            {"key": "expires_at_iso", "range": {"gte": now}}
        ]
    })
    
    if filters:
        # Type filter
        if filters.get("type_any"):
            must_conditions.append({
                "key": "type",
                "match": {"any": filters["type_any"]}
            })
        
        # Importance filter
        if filters.get("min_importance") is not None:
            must_conditions.append({
                "key": "importance",
                "range": {"gte": filters["min_importance"]}
            })
        
        # Tags filter
        if filters.get("tags_any"):
            must_conditions.append({
                "key": "tags",
                "match": {"any": filters["tags_any"]}
            })
        
        # Time range filter
        if filters.get("time_range_days"):
            cutoff_date = datetime.utcnow() - timedelta(days=filters["time_range_days"])
            must_conditions.append({
                "key": "timestamp_iso",
                "range": {"gte": cutoff_date.isoformat()}
            })
    
    return {"must": must_conditions}


def generate_dedupe_key(text: str, user_id: str) -> str:
    """
    Generates a stable dedupe key based on semantic meaning.
    
    Args:
        text: Text content
        user_id: User ID
    
    Returns:
        Stable hash-based dedupe key
    """
    # Normalize text: lowercase, strip, remove extra whitespace
    normalized = " ".join(text.lower().strip().split())
    
    # Create hash from normalized text + user_id
    content = f"{user_id}:{normalized[:200]}"  # Use first 200 chars for consistency
    return hashlib.md5(content.encode()).hexdigest()


def calculate_expires_at(timestamp_iso: str, ttl_days: int) -> str:
    """
    Calculates expiration timestamp.
    
    Args:
        timestamp_iso: ISO timestamp of memory creation
        ttl_days: Time to live in days (0 = never expires)
    
    Returns:
        ISO timestamp of expiration or "never"
    """
    if ttl_days == 0:
        return "never"
    
    try:
        timestamp = datetime.fromisoformat(timestamp_iso.replace('Z', '+00:00'))
        expires_at = timestamp + timedelta(days=ttl_days)
        return expires_at.isoformat()
    except Exception as e:
        logger.error(f"Error calculating expiration: {e}")
        return "never"
