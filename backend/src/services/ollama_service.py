from typing import List, Dict
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
    
    def generate_chat(self, messages: List[Dict], model: str = "qwen3:4b-instruct") -> str:
        """
        Gera resposta de chat usando Ollama via HTTP.
        
        Args:
            messages: Lista de mensagens no formato [{"role": "user/system/assistant", "content": "..."}]
            model: Modelo a usar (default: qwen3:4b-instruct)
        
        Returns:
            Resposta do modelo como string
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                },
                timeout=60
            )
            response.raise_for_status()
            return response.json()['message']['content']
        except requests.exceptions.RequestException as e:
            print(f"Erro ao gerar chat: {e}")
            raise