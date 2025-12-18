from typing import List
import requests
import os

class OllamaService:
    def __init__(self, model: str = "nomic-embed-text"):
        self.model = model
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