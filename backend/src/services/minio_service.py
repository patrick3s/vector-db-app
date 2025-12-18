"""
MinIO Service - Gerencia upload/download de arquivos no MinIO
"""
import os
import io
from datetime import timedelta
from typing import Optional, BinaryIO
from minio import Minio
from minio.error import S3Error


class MinioService:
    """Serviço para interagir com o MinIO (S3-compatible object storage)"""
    
    def __init__(self):
        # Configuração via variáveis de ambiente
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9001")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.bucket_name = os.getenv("MINIO_BUCKET", "documents")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        
        # Inicializa cliente MinIO
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        
        # Garante que o bucket existe
        self._ensure_bucket()
    
    def _ensure_bucket(self) -> None:
        """Cria o bucket se não existir"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Bucket '{self.bucket_name}' criado com sucesso")
        except S3Error as e:
            print(f"Erro ao verificar/criar bucket: {e}")
            raise
    
    def upload_file(
        self, 
        file_data: BinaryIO, 
        object_name: str, 
        content_type: str = "application/octet-stream",
        file_size: Optional[int] = None
    ) -> str:
        """
        Faz upload de um arquivo para o MinIO
        
        Args:
            file_data: Dados do arquivo (file-like object)
            object_name: Nome do objeto no MinIO (ex: "uuid-filename.pdf")
            content_type: Tipo MIME do arquivo
            file_size: Tamanho do arquivo em bytes (opcional, -1 para desconhecido)
        
        Returns:
            Nome do objeto armazenado
        """
        try:
            # Se file_size não for fornecido, tenta determinar
            if file_size is None:
                file_data.seek(0, 2)  # Move para o final
                file_size = file_data.tell()
                file_data.seek(0)  # Volta para o início
            
            self.client.put_object(
                self.bucket_name,
                object_name,
                file_data,
                length=file_size,
                content_type=content_type
            )
            return object_name
        except S3Error as e:
            print(f"Erro ao fazer upload: {e}")
            raise
    
    def upload_bytes(
        self, 
        data: bytes, 
        object_name: str, 
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Faz upload de bytes para o MinIO
        
        Args:
            data: Dados em bytes
            object_name: Nome do objeto no MinIO
            content_type: Tipo MIME do arquivo
        
        Returns:
            Nome do objeto armazenado
        """
        file_data = io.BytesIO(data)
        return self.upload_file(file_data, object_name, content_type, len(data))
    
    def download_file(self, object_name: str) -> bytes:
        """
        Faz download de um arquivo do MinIO
        
        Args:
            object_name: Nome do objeto no MinIO
        
        Returns:
            Conteúdo do arquivo em bytes
        """
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            print(f"Erro ao fazer download: {e}")
            raise
    
    def get_presigned_url(
        self, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Gera uma URL pré-assinada para download do arquivo
        
        Args:
            object_name: Nome do objeto no MinIO
            expires: Tempo de expiração da URL (padrão: 1 hora)
        
        Returns:
            URL pré-assinada para download
        """
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=expires
            )
            return url
        except S3Error as e:
            print(f"Erro ao gerar URL pré-assinada: {e}")
            raise
    
    def delete_file(self, object_name: str) -> None:
        """
        Remove um arquivo do MinIO
        
        Args:
            object_name: Nome do objeto no MinIO
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
        except S3Error as e:
            print(f"Erro ao deletar arquivo: {e}")
            raise
    
    def file_exists(self, object_name: str) -> bool:
        """
        Verifica se um arquivo existe no MinIO
        
        Args:
            object_name: Nome do objeto no MinIO
        
        Returns:
            True se o arquivo existe, False caso contrário
        """
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False


# Singleton para reutilização
_minio_service: Optional[MinioService] = None


def get_minio_service() -> MinioService:
    """Obtém a instância do MinioService (singleton)"""
    global _minio_service
    if _minio_service is None:
        _minio_service = MinioService()
    return _minio_service
