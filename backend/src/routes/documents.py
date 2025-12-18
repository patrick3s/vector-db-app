"""
Documents API Routes - Upload, download e gerenciamento de documentos
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, status
from pydantic import BaseModel

from ..services.minio_service import get_minio_service
from ..services.document_service import get_document_service
from ..services.vector_db_service import get_db_service
from ..services.ollama_service import OllamaService

router = APIRouter(prefix="/documents", tags=["documents"])

# Serviços
ollama_service = OllamaService()


class DocumentUploadResponse(BaseModel):
    """Resposta do upload de documento"""
    id: str
    text_preview: str
    document_url: str
    document_name: str
    document_format: str
    total_pages: int
    is_multipage: bool


class DocumentDownloadResponse(BaseModel):
    """Resposta com URL de download"""
    download_url: str
    document_name: str
    expires_in_seconds: int


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user: Optional[str] = Query(None, description="Nome do usuário"),
    collection: Optional[str] = Query(None, description="Nome da coleção")
):
    """
    Faz upload de um documento, extrai texto, gera embedding e armazena
    
    Formatos suportados:
    - TXT (text/plain)
    - JSON (application/json)
    - PDF (application/pdf)
    - DOCX (Word)
    - CSV (text/csv)
    - XLSX/XLS (Excel)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome do arquivo é obrigatório"
        )
    
    # Serviços
    minio_service = get_minio_service()
    document_service = get_document_service()
    
    try:
        # Lê o conteúdo do arquivo
        file_content = await file.read()
        
        # Extrai texto do documento
        text, page_info = document_service.extract_text(
            file_content, 
            file.filename, 
            file.content_type
        )
        
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foi possível extrair texto do documento. O arquivo pode estar vazio ou corrompido."
            )
        
        # Gera nome único para o objeto no MinIO
        file_extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
        object_name = f"{uuid.uuid4()}-{file.filename}"
        
        # Faz upload para o MinIO
        minio_service.upload_bytes(
            file_content,
            object_name,
            file.content_type or "application/octet-stream"
        )
        
        # Gera embedding do texto
        embedding = ollama_service.generate_embedding(text)
        
        # Monta metadata com informações do documento
        metadata = {
            "source_type": "document",
            "document_bucket": minio_service.bucket_name,
            "document_key": object_name,
            "document_name": file.filename,
            "document_format": file_extension,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "total_pages": page_info.total_pages,
            "is_multipage": page_info.is_multipage,
            "page_range": page_info.page_range,
        }
        
        # Armazena no banco de vetores
        db_service = get_db_service(user=user, collection=collection, auto_create=True)
        vector_id = db_service.add_vector(text, embedding, metadata)
        
        # Gera URL de download (temporária - 1 hora)
        download_url = minio_service.get_presigned_url(object_name)
        
        # Retorna preview do texto (primeiros 500 caracteres)
        text_preview = text[:500] + "..." if len(text) > 500 else text
        
        return DocumentUploadResponse(
            id=vector_id,
            text_preview=text_preview,
            document_url=download_url,
            document_name=file.filename,
            document_format=file_extension,
            total_pages=page_info.total_pages,
            is_multipage=page_info.is_multipage
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar documento: {str(e)}"
        )


@router.get("/{document_id}/download", response_model=DocumentDownloadResponse)
async def get_document_download_url(
    document_id: str,
    user: Optional[str] = Query(None, description="Nome do usuário"),
    collection: Optional[str] = Query(None, description="Nome da coleção")
):
    """
    Retorna URL pré-assinada para download do documento
    
    A URL expira em 1 hora.
    """
    try:
        # Busca o vetor para obter informações do documento
        db_service = get_db_service(user=user, collection=collection)
        vectors = db_service.get_all_vectors()
        
        # Encontra o vetor pelo ID
        target_vector = None
        for vector in vectors:
            if vector.get("id") == document_id:
                target_vector = vector
                break
        
        if not target_vector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento não encontrado: {document_id}"
            )
        
        metadata = target_vector.get("metadata", {})
        
        # Verifica se é um documento (não texto simples)
        if metadata.get("source_type") != "document":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este item não é um documento. Apenas documentos podem ser baixados."
            )
        
        document_key = metadata.get("document_key")
        document_name = metadata.get("document_name", "documento")
        
        if not document_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Arquivo do documento não encontrado no armazenamento"
            )
        
        # Gera URL pré-assinada
        minio_service = get_minio_service()
        download_url = minio_service.get_presigned_url(document_key)
        
        return DocumentDownloadResponse(
            download_url=download_url,
            document_name=document_name,
            expires_in_seconds=3600  # 1 hora
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar URL de download: {str(e)}"
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: Optional[str] = Query(None, description="Nome do usuário"),
    collection: Optional[str] = Query(None, description="Nome da coleção")
):
    """
    Remove um documento do sistema
    
    Remove o vetor do Qdrant e o arquivo do MinIO.
    """
    try:
        # Busca o vetor para obter informações do documento
        db_service = get_db_service(user=user, collection=collection)
        vectors = db_service.get_all_vectors()
        
        # Encontra o vetor pelo ID
        target_vector = None
        for vector in vectors:
            if vector.get("id") == document_id:
                target_vector = vector
                break
        
        if not target_vector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento não encontrado: {document_id}"
            )
        
        metadata = target_vector.get("metadata", {})
        
        # Se for um documento, remove também do MinIO
        if metadata.get("source_type") == "document":
            document_key = metadata.get("document_key")
            if document_key:
                try:
                    minio_service = get_minio_service()
                    minio_service.delete_file(document_key)
                except Exception as e:
                    # Log o erro mas continua removendo o vetor
                    print(f"Aviso: Erro ao remover arquivo do MinIO: {e}")
        
        # Remove o vetor do banco
        db_service.delete_vector(document_id)
        
        return {
            "message": "Documento removido com sucesso",
            "id": document_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover documento: {str(e)}"
        )
