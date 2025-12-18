"""
Document Service - Extração de texto de documentos em múltiplos formatos
Suportados: TXT, JSON, PDF, DOCX, CSV, XLSX, XLS
"""
import io
import json
import csv
from dataclasses import dataclass
from typing import Tuple, Optional
import pandas as pd


@dataclass
class PageInfo:
    """Informações sobre as páginas do documento"""
    total_pages: int
    is_multipage: bool
    page_range: str  # ex: "1-15"


class DocumentService:
    """Serviço para extrair texto de diferentes formatos de documento"""
    
    # Mapeamento de content-types para formatos
    CONTENT_TYPE_MAP = {
        "text/plain": "txt",
        "application/json": "json",
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc",
        "text/csv": "csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/vnd.ms-excel": "xls",
    }
    
    # Extensões suportadas
    SUPPORTED_EXTENSIONS = {"txt", "json", "pdf", "docx", "csv", "xlsx", "xls"}
    
    def extract_text(
        self, 
        file_data: bytes, 
        filename: str, 
        content_type: Optional[str] = None
    ) -> Tuple[str, PageInfo]:
        """
        Extrai texto de um documento, detectando o formato automaticamente
        
        Args:
            file_data: Dados do arquivo em bytes
            filename: Nome do arquivo original
            content_type: Tipo MIME do arquivo (opcional)
        
        Returns:
            Tupla (texto extraído, informações de páginas)
        """
        # Detecta formato pelo content-type ou extensão
        file_format = self._detect_format(filename, content_type)
        
        # Chama o extrator apropriado
        extractors = {
            "txt": self.extract_text_from_txt,
            "json": self.extract_text_from_json,
            "pdf": self.extract_text_from_pdf,
            "docx": self.extract_text_from_docx,
            "csv": self.extract_text_from_csv,
            "xlsx": self.extract_text_from_excel,
            "xls": self.extract_text_from_excel,
        }
        
        extractor = extractors.get(file_format)
        if not extractor:
            raise ValueError(f"Formato não suportado: {file_format}")
        
        return extractor(file_data)
    
    def _detect_format(
        self, 
        filename: str, 
        content_type: Optional[str] = None
    ) -> str:
        """Detecta o formato do arquivo pelo content-type ou extensão"""
        # Tenta pelo content-type primeiro
        if content_type and content_type in self.CONTENT_TYPE_MAP:
            return self.CONTENT_TYPE_MAP[content_type]
        
        # Fallback para extensão do arquivo
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if extension in self.SUPPORTED_EXTENSIONS:
            return extension
        
        raise ValueError(f"Não foi possível detectar o formato do arquivo: {filename}")
    
    def extract_text_from_txt(self, file_data: bytes) -> Tuple[str, PageInfo]:
        """Extrai texto de arquivo TXT"""
        text = file_data.decode("utf-8", errors="replace")
        page_info = PageInfo(
            total_pages=1,
            is_multipage=False,
            page_range="1"
        )
        return text.strip(), page_info
    
    def extract_text_from_json(self, file_data: bytes) -> Tuple[str, PageInfo]:
        """Extrai texto de arquivo JSON (converte para string formatada)"""
        try:
            data = json.loads(file_data.decode("utf-8"))
            # Converte JSON para texto legível
            text = json.dumps(data, indent=2, ensure_ascii=False)
        except json.JSONDecodeError:
            text = file_data.decode("utf-8", errors="replace")
        
        page_info = PageInfo(
            total_pages=1,
            is_multipage=False,
            page_range="1"
        )
        return text.strip(), page_info
    
    def extract_text_from_pdf(self, file_data: bytes) -> Tuple[str, PageInfo]:
        """Extrai texto de arquivo PDF"""
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            raise ImportError("PyPDF2 não está instalado. Execute: pip install PyPDF2")
        
        pdf_file = io.BytesIO(file_data)
        reader = PdfReader(pdf_file)
        
        total_pages = len(reader.pages)
        text_parts = []
        
        for page_num, page in enumerate(reader.pages, 1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(f"--- Página {page_num} ---\n{page_text}")
        
        text = "\n\n".join(text_parts)
        page_info = PageInfo(
            total_pages=total_pages,
            is_multipage=total_pages > 1,
            page_range=f"1-{total_pages}" if total_pages > 1 else "1"
        )
        
        return text.strip(), page_info
    
    def extract_text_from_docx(self, file_data: bytes) -> Tuple[str, PageInfo]:
        """Extrai texto de arquivo DOCX (Word)"""
        try:
            from docx import Document
        except ImportError:
            raise ImportError("python-docx não está instalado. Execute: pip install python-docx")
        
        doc_file = io.BytesIO(file_data)
        document = Document(doc_file)
        
        # Conta quebras de página (aproximado)
        page_breaks = 0
        text_parts = []
        
        for para in document.paragraphs:
            text_parts.append(para.text)
            # Verifica se há quebra de página no parágrafo
            for run in para.runs:
                if hasattr(run, '_element'):
                    # Procura por elementos de quebra de página
                    for child in run._element:
                        if 'lastRenderedPageBreak' in child.tag or 'br' in child.tag:
                            page_breaks += 1
        
        # Adiciona texto de tabelas
        for table in document.tables:
            for row in table.rows:
                row_text = [cell.text for cell in row.cells]
                text_parts.append(" | ".join(row_text))
        
        text = "\n".join(text_parts)
        total_pages = page_breaks + 1  # Pelo menos 1 página
        
        page_info = PageInfo(
            total_pages=total_pages,
            is_multipage=total_pages > 1,
            page_range=f"1-{total_pages}" if total_pages > 1 else "1"
        )
        
        return text.strip(), page_info
    
    def extract_text_from_csv(self, file_data: bytes) -> Tuple[str, PageInfo]:
        """Extrai texto de arquivo CSV"""
        content = file_data.decode("utf-8", errors="replace")
        
        # Usa pandas para ler e formatar o CSV
        try:
            df = pd.read_csv(io.StringIO(content))
            text = df.to_string(index=False)
        except Exception:
            # Fallback: lê como texto simples
            text = content
        
        page_info = PageInfo(
            total_pages=1,
            is_multipage=False,
            page_range="1"
        )
        
        return text.strip(), page_info
    
    def extract_text_from_excel(self, file_data: bytes) -> Tuple[str, PageInfo]:
        """Extrai texto de arquivo Excel (XLSX/XLS)"""
        try:
            # Lê todas as planilhas do Excel
            excel_file = io.BytesIO(file_data)
            excel_data = pd.read_excel(excel_file, sheet_name=None, engine="openpyxl")
        except Exception as e:
            raise ValueError(f"Erro ao ler arquivo Excel: {e}")
        
        text_parts = []
        total_sheets = len(excel_data)
        
        for sheet_name, df in excel_data.items():
            sheet_text = f"--- Planilha: {sheet_name} ---\n"
            sheet_text += df.to_string(index=False)
            text_parts.append(sheet_text)
        
        text = "\n\n".join(text_parts)
        
        # Considera cada planilha como uma "página"
        page_info = PageInfo(
            total_pages=total_sheets,
            is_multipage=total_sheets > 1,
            page_range=f"1-{total_sheets}" if total_sheets > 1 else "1"
        )
        
        return text.strip(), page_info


# Singleton para reutilização
_document_service: Optional[DocumentService] = None


def get_document_service() -> DocumentService:
    """Obtém a instância do DocumentService (singleton)"""
    global _document_service
    if _document_service is None:
        _document_service = DocumentService()
    return _document_service
