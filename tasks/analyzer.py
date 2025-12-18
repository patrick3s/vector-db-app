#!/usr/bin/env python3
"""
Analisador usando Ollama com modelo Gemma3:1b
"""

import ollama
from typing import Optional, List, Dict, Any


class OllamaAnalyzer:
    """Classe para interagir com o Ollama usando o modelo Gemma3:1b"""
    
    def __init__(self, model: str = "gemma3:1b"):
        """
        Inicializa o analisador.
        
        Args:
            model: Nome do modelo a ser usado (default: gemma3:1b)
        """
        self.model = model
        self.client = ollama.Client()
    
    def chat(self, message: str, system_prompt: Optional[str] = None) -> str:
        """
        Envia uma mensagem para o modelo e retorna a resposta.
        
        Args:
            message: Mensagem do usuário
            system_prompt: Prompt de sistema opcional
        
        Returns:
            Resposta do modelo
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        response = self.client.chat(
            model=self.model,
            messages=messages
        )
        
        return response["message"]["content"]
    
    def chat_stream(self, message: str, system_prompt: Optional[str] = None):
        """
        Envia uma mensagem e retorna a resposta em streaming.
        
        Args:
            message: Mensagem do usuário
            system_prompt: Prompt de sistema opcional
        
        Yields:
            Chunks da resposta
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        stream = self.client.chat(
            model=self.model,
            messages=messages,
            stream=True
        )
        
        for chunk in stream:
            yield chunk["message"]["content"]
    
    def generate(self, prompt: str) -> str:
        """
        Gera texto a partir de um prompt simples.
        
        Args:
            prompt: Prompt para geração
        
        Returns:
            Texto gerado
        """
        response = self.client.generate(
            model=self.model,
            prompt=prompt
        )
        
        return response["response"]
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Gera embedding para um texto.
        
        Args:
            text: Texto para gerar embedding
        
        Returns:
            Lista de floats representando o embedding
        """
        response = self.client.embeddings(
            model=self.model,
            prompt=text
        )
        
        return response["embedding"]
    
    def analyze(self, text: str, task: str = "resumir") -> str:
        """
        Analisa um texto de acordo com a tarefa especificada.
        
        Args:
            text: Texto a ser analisado
            task: Tipo de análise (resumir, traduzir, explicar, etc.)
        
        Returns:
            Resultado da análise
        """
        prompts = {
            "resumir": f"Resuma o seguinte texto de forma concisa:\n\n{text}",
            "traduzir": f"Traduza o seguinte texto para inglês:\n\n{text}",
            "explicar": f"Explique o seguinte texto de forma simples:\n\n{text}",
            "sentimento": f"Analise o sentimento do seguinte texto (positivo, negativo ou neutro):\n\n{text}",
            "keywords": f"Extraia as palavras-chave do seguinte texto:\n\n{text}"
        }
        
        prompt = prompts.get(task, f"{task}:\n\n{text}")
        return self.generate(prompt)


def main():
    """Exemplo de uso do analisador"""
    analyzer = OllamaAnalyzer(model="gemma3:1b")
    
    # Teste simples de chat
    print("=== Teste de Chat ===")
    response = analyzer.chat("Olá! Qual é o seu nome?")
    print(f"Resposta: {response}\n")
    
    # Teste de geração
    print("=== Teste de Geração ===")
    response = analyzer.generate("Escreva um haiku sobre programação:")
    print(f"Resposta: {response}\n")
    
    # Teste de análise
    print("=== Teste de Análise ===")
    texto = "Python é uma linguagem de programação muito popular e fácil de aprender."
    resumo = analyzer.analyze(texto, task="resumir")
    print(f"Resumo: {resumo}\n")
    
    # Teste de streaming
    print("=== Teste de Streaming ===")
    print("Resposta: ", end="", flush=True)
    for chunk in analyzer.chat_stream("Conte até 5"):
        print(chunk, end="", flush=True)
    print("\n")


if __name__ == "__main__":
    main()
