from typing import List, Optional
import requests
import os

class OllamaService:
    def __init__(self, model: Optional[str] = None):
        self.model = model or os.getenv("OLLAMA_MODEL", "Qwen3-Embedding")
        # Usa a porta padrão do Ollama (11434)
        self.base_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434")

    def generate_embedding(self, text: str) -> List[float]:
        """Gera embeddings para um texto usando Ollama via HTTP"""
        try:
            response = requests.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.model, "prompt": text},
                timeout=30
            )
            response.raise_for_status()
            return response.json()['embedding']
        except requests.exceptions.RequestException as e:
            print(f"Erro ao gerar embedding: {e}")
            raise

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Gera embeddings para múltiplos textos"""
        return [self.generate_embedding(text) for text in texts]