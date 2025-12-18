"""
Text Chunking - Utilitário para dividir textos grandes em chunks
"""
from typing import List
from dataclasses import dataclass


@dataclass
class TextChunk:
    """Representa um chunk de texto"""
    text: str
    chunk_index: int
    total_chunks: int
    start_char: int
    end_char: int


def chunk_text(
    text: str, 
    chunk_size: int = 1000, 
    chunk_overlap: int = 200
) -> List[TextChunk]:
    """
    Divide um texto em chunks com overlap opcional.
    
    Args:
        text: Texto para dividir
        chunk_size: Tamanho máximo de cada chunk em caracteres
        chunk_overlap: Quantidade de caracteres de overlap entre chunks
        
    Returns:
        Lista de TextChunk
    """
    if not text or not text.strip():
        return []
    
    text = text.strip()
    
    # Se o texto é menor que o chunk_size, retorna um único chunk
    if len(text) <= chunk_size:
        return [TextChunk(
            text=text,
            chunk_index=0,
            total_chunks=1,
            start_char=0,
            end_char=len(text)
        )]
    
    chunks = []
    start = 0
    chunk_index = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Se não é o último chunk, tenta quebrar em um espaço/parágrafo
        if end < len(text):
            # Procura o último espaço/quebra de linha dentro do chunk
            last_break = text.rfind('\n\n', start, end)  # Parágrafo
            if last_break == -1 or last_break <= start:
                last_break = text.rfind('\n', start, end)  # Linha
            if last_break == -1 or last_break <= start:
                last_break = text.rfind('. ', start, end)  # Sentença
            if last_break == -1 or last_break <= start:
                last_break = text.rfind(' ', start, end)  # Palavra
            
            if last_break > start:
                end = last_break + 1
        else:
            end = len(text)
        
        chunk_text_content = text[start:end].strip()
        
        if chunk_text_content:
            chunks.append(TextChunk(
                text=chunk_text_content,
                chunk_index=chunk_index,
                total_chunks=0,  # Será atualizado depois
                start_char=start,
                end_char=end
            ))
            chunk_index += 1
        
        # Move para o próximo chunk com overlap
        start = end - chunk_overlap if end < len(text) else end
        
        # Evita loops infinitos
        if start >= end:
            start = end
    
    # Atualiza total_chunks em todos os chunks
    total = len(chunks)
    for chunk in chunks:
        chunk.total_chunks = total
    
    return chunks


def estimate_chunks(text_length: int, chunk_size: int = 1000, chunk_overlap: int = 200) -> int:
    """
    Estima quantos chunks serão gerados baseado no tamanho do texto.
    
    Args:
        text_length: Tamanho do texto em caracteres
        chunk_size: Tamanho de cada chunk
        chunk_overlap: Overlap entre chunks
        
    Returns:
        Número estimado de chunks
    """
    if text_length <= chunk_size:
        return 1
    
    effective_chunk_size = chunk_size - chunk_overlap
    return max(1, (text_length + effective_chunk_size - 1) // effective_chunk_size)
