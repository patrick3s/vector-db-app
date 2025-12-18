import axios from 'axios';

// Detecta automaticamente o host de onde a aplicação está sendo acessada
// Se acessar por localhost, usa localhost. Se acessar pelo IP, usa o IP.
const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_PORT = '9000';
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

// Tipos
export interface VectorData {
    id: string;
    text: string;
    metadata?: Record<string, any>;
    score?: number;
}

export interface VectorInput {
    text: string;
    metadata?: Record<string, any>;
}

export interface SearchResult {
    id: string;
    text: string;
    score: number;
    metadata?: Record<string, any>;
}

export interface ContextInfo {
    user: string | null;
    collection: string | null;
    collection_name: string;
}

export interface CollectionInfo {
    name: string;
    vectors_count: number;
    status: string;
}

// Classe de erro customizada para a API
export class ApiError extends Error {
    statusCode: number;
    userMessage: string;
    technicalDetails?: string;

    constructor(statusCode: number, userMessage: string, technicalDetails?: string) {
        super(userMessage);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.userMessage = userMessage;
        this.technicalDetails = technicalDetails;
    }
}

// Função para extrair mensagem de erro amigável
const parseApiError = (error: any): ApiError => {
    // Erro do Axios com resposta do servidor
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Tenta extrair a mensagem do detail (FastAPI padrão)
        let message = 'Erro desconhecido';
        if (typeof data === 'string') {
            message = data;
        } else if (data?.detail) {
            message = data.detail;
        } else if (data?.message) {
            message = data.message;
        }

        // Mensagens personalizadas para status codes comuns
        switch (status) {
            case 404:
                return new ApiError(status, message, 'Recurso não encontrado');
            case 503:
                return new ApiError(status, message, 'Serviço indisponível');
            case 400:
                return new ApiError(status, `Requisição inválida: ${message}`, 'Verifique os parâmetros');
            case 500:
                return new ApiError(status, message, 'Erro interno do servidor');
            default:
                return new ApiError(status, message);
        }
    }

    // Erro de rede (sem resposta)
    if (error.request) {
        return new ApiError(
            0,
            'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
            'Erro de conexão'
        );
    }

    // Erro desconhecido
    return new ApiError(500, error.message || 'Erro desconhecido');
};

// Helper para construir query params
const buildParams = (user?: string, collection?: string): string => {
    const params = new URLSearchParams();
    if (user) params.append('user', user);
    if (collection) params.append('collection', collection);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Busca informações do contexto (usuário, coleção)
 */
export const getContext = async (user?: string, collection?: string): Promise<ContextInfo> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/vectors/context${buildParams(user, collection)}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar contexto:', error);
        throw parseApiError(error);
    }
};

/**
 * Lista todos os vetores (memórias)
 */
export const fetchVectors = async (user?: string, collection?: string): Promise<VectorData[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/vectors${buildParams(user, collection)}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar vetores:', error);
        throw parseApiError(error);
    }
};

/**
 * Adiciona um novo vetor (memória)
 */
export const saveVector = async (text: string, metadata?: Record<string, any>, user?: string, collection?: string): Promise<VectorData> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/vectors${buildParams(user, collection)}`,
            { text, metadata }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar vetor:', error);
        throw parseApiError(error);
    }
};

/**
 * Atualiza um vetor (memória) existente
 */
export const updateVector = async (vectorId: string, text: string, metadata?: Record<string, any>, user?: string, collection?: string): Promise<VectorData> => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/vectors/${vectorId}${buildParams(user, collection)}`,
            { text, metadata }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar vetor:', error);
        throw parseApiError(error);
    }
};

/**
 * Remove um vetor (memória)
 */
export const deleteVector = async (vectorId: string, user?: string, collection?: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/vectors/${vectorId}${buildParams(user, collection)}`);
    } catch (error) {
        console.error('Erro ao deletar vetor:', error);
        throw parseApiError(error);
    }
};

/**
 * Busca vetores similares usando busca semântica
 */
export const searchVectors = async (text: string, limit: number = 5, user?: string, collection?: string): Promise<SearchResult[]> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/vectors/search${buildParams(user, collection)}`,
            { text, limit }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar vetores similares:', error);
        throw parseApiError(error);
    }
};

/**
 * Lista todas as coleções disponíveis
 */
export const fetchCollections = async (): Promise<CollectionInfo[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/vectors/collections`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar coleções:', error);
        throw parseApiError(error);
    }
};

/**
 * Busca vetores de uma coleção específica pelo nome da coleção
 */
export const fetchVectorsByCollectionName = async (collectionName: string): Promise<VectorData[]> => {
    try {
        // O nome da coleção já está formatado, então passamos diretamente
        const response = await axios.get(`${API_BASE_URL}/vectors?collection=${collectionName}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar vetores da coleção:', error);
        throw parseApiError(error);
    }
};

/**
 * Busca semântica em uma coleção específica pelo nome
 */
export const searchVectorsByCollectionName = async (collectionName: string, text: string, limit: number = 5): Promise<SearchResult[]> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/vectors/search?collection=${collectionName}`,
            { text, limit }
        );
        return response.data;
    } catch (error) {
        console.error('Erro na busca semântica:', error);
        throw parseApiError(error);
    }
};

/**
 * Cria uma nova coleção
 */
export const createCollection = async (name: string): Promise<{ message: string; name: string }> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/vectors/collections`, { name });
        return response.data;
    } catch (error) {
        console.error('Erro ao criar coleção:', error);
        throw parseApiError(error);
    }
};

/**
 * Deleta uma coleção
 */
export const deleteCollection = async (collectionName: string): Promise<{ message: string; name: string }> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/vectors/collections/${collectionName}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao deletar coleção:', error);
        throw parseApiError(error);
    }
};

// =====================
// DOCUMENTOS API
// =====================

export interface DocumentUploadResult {
    id: string;
    text_preview: string;
    document_url: string;
    document_name: string;
    document_format: string;
    total_pages: number;
    is_multipage: boolean;
}

export interface DocumentDownloadResult {
    download_url: string;
    document_name: string;
    expires_in_seconds: number;
}

/**
 * Faz upload de um documento para vetorização
 */
export const uploadDocument = async (
    file: File,
    user?: string,
    collection?: string,
    onProgress?: (progress: number) => void
): Promise<DocumentUploadResult> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            `${API_BASE_URL}/documents/upload${buildParams(user, collection)}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao fazer upload do documento:', error);
        throw parseApiError(error);
    }
};

/**
 * Obtém URL de download de um documento
 */
export const getDocumentDownloadUrl = async (
    documentId: string,
    user?: string,
    collection?: string
): Promise<DocumentDownloadResult> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/documents/${documentId}/download${buildParams(user, collection)}`
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao obter URL de download:', error);
        throw parseApiError(error);
    }
};

/**
 * Remove um documento (vetor + arquivo)
 */
export const deleteDocument = async (
    documentId: string,
    user?: string,
    collection?: string
): Promise<{ message: string; id: string }> => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/documents/${documentId}${buildParams(user, collection)}`
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao deletar documento:', error);
        throw parseApiError(error);
    }
};

// Alias para compatibilidade
export const saveVectorData = saveVector;