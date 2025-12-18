import React, { useState, useCallback, useRef } from 'react';
import { uploadDocument, DocumentUploadResult, ApiError } from '../services/api';

// Formatos suportados
const SUPPORTED_FORMATS = [
    { extension: 'txt', mime: 'text/plain', icon: '📄', label: 'TXT' },
    { extension: 'json', mime: 'application/json', icon: '📋', label: 'JSON' },
    { extension: 'pdf', mime: 'application/pdf', icon: '📕', label: 'PDF' },
    { extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: '📘', label: 'Word' },
    { extension: 'csv', mime: 'text/csv', icon: '📊', label: 'CSV' },
    { extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: '📗', label: 'Excel' },
    { extension: 'xls', mime: 'application/vnd.ms-excel', icon: '📗', label: 'Excel' },
];

const ACCEPTED_EXTENSIONS = SUPPORTED_FORMATS.map(f => `.${f.extension}`).join(',');

interface UploadState {
    file: File | null;
    progress: number;
    isUploading: boolean;
    result: DocumentUploadResult | null;
    error: string | null;
}

const DocumentUploader: React.FC = () => {
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [user, setUser] = useState<string>('');
    const [uploadState, setUploadState] = useState<UploadState>({
        file: null,
        progress: 0,
        isUploading: false,
        result: null,
        error: null,
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const format = SUPPORTED_FORMATS.find(f => f.extension === ext);
        return format?.icon || '📄';
    };

    const validateFile = (file: File): string | null => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!SUPPORTED_FORMATS.some(f => f.extension === ext)) {
            return `Formato não suportado: .${ext}. Formatos aceitos: ${SUPPORTED_FORMATS.map(f => f.label).join(', ')}`;
        }
        // Limite de 50MB
        if (file.size > 50 * 1024 * 1024) {
            return 'Arquivo muito grande. O tamanho máximo é 50MB.';
        }
        return null;
    };

    const handleFileSelect = useCallback((file: File) => {
        const error = validateFile(file);
        if (error) {
            setUploadState(prev => ({ ...prev, error, file: null }));
            return;
        }
        setUploadState({
            file,
            progress: 0,
            isUploading: false,
            result: null,
            error: null,
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!uploadState.file) return;

        setUploadState(prev => ({ ...prev, isUploading: true, error: null, progress: 0 }));

        try {
            const result = await uploadDocument(
                uploadState.file,
                user || undefined,
                selectedCollection || undefined,
                (progress) => setUploadState(prev => ({ ...prev, progress }))
            );

            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                result,
                progress: 100,
            }));
        } catch (error) {
            const apiError = error as ApiError;
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                error: apiError.userMessage || 'Erro ao fazer upload do documento',
            }));
        }
    };

    const handleReset = () => {
        setUploadState({
            file: null,
            progress: 0,
            isUploading: false,
            result: null,
            error: null,
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="app-container">
            <div className="page-header">
                <h1 className="page-title">📁 Upload de Documentos</h1>
                <p className="page-subtitle">
                    Faça upload de documentos para vetorização automática
                </p>
            </div>

            {/* Filtros */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 className="card-title">⚙️ Configurações</h3>
                <div className="grid-2" style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className="form-group">
                        <label className="form-label">Usuário (opcional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nome do usuário"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Coleção</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nome da coleção"
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Área de Upload */}
            <div className="card">
                <h3 className="card-title">📤 Selecionar Documento</h3>

                {/* Drop Zone */}
                <div
                    className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${uploadState.file ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploadState.file && fileInputRef.current?.click()}
                    style={{
                        marginTop: 'var(--spacing-md)',
                        padding: 'var(--spacing-xl)',
                        border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        cursor: uploadState.file ? 'default' : 'pointer',
                        background: isDragOver ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />

                    {!uploadState.file ? (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>
                                📂
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                Arraste um arquivo aqui ou <strong>clique para selecionar</strong>
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Formatos suportados: {SUPPORTED_FORMATS.map(f => f.label).join(', ')} (máx 50MB)
                            </p>
                        </>
                    ) : (
                        <div>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>
                                {getFileIcon(uploadState.file.name)}
                            </div>
                            <p style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                                {uploadState.file.name}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                {formatFileSize(uploadState.file.size)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Barra de Progresso */}
                {uploadState.isUploading && (
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <div className="progress-bar" style={{
                            height: '8px',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${uploadState.progress}%`,
                                height: '100%',
                                background: 'var(--color-primary)',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <p style={{
                            textAlign: 'center',
                            marginTop: 'var(--spacing-xs)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            Enviando... {uploadState.progress}%
                        </p>
                    </div>
                )}

                {/* Mensagem de Erro */}
                {uploadState.error && (
                    <div className="alert alert-error" style={{ marginTop: 'var(--spacing-md)' }}>
                        ❌ {uploadState.error}
                    </div>
                )}

                {/* Resultado do Upload */}
                {uploadState.result && (
                    <div className="alert alert-success" style={{ marginTop: 'var(--spacing-md)' }}>
                        <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>✅ Upload realizado com sucesso!</h4>
                        <div style={{ fontSize: '0.875rem' }}>
                            <p><strong>Documento:</strong> {uploadState.result.document_name}</p>
                            <p><strong>Formato:</strong> {uploadState.result.document_format.toUpperCase()}</p>
                            <p><strong>Páginas:</strong> {uploadState.result.total_pages} {uploadState.result.is_multipage && '(múltiplas páginas)'}</p>
                            <p><strong>Memórias criadas:</strong> {uploadState.result.total_chunks} {uploadState.result.total_chunks > 1 && '(texto dividido em chunks)'}</p>
                            <p style={{ marginTop: 'var(--spacing-sm)' }}><strong>Preview do texto:</strong></p>
                            <div style={{
                                background: 'var(--color-bg-tertiary)',
                                padding: 'var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)',
                                maxHeight: '150px',
                                overflow: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {uploadState.result.text_preview}
                            </div>
                        </div>
                    </div>
                )}

                {/* Botões de Ação */}
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    justifyContent: 'flex-end'
                }}>
                    {uploadState.file && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleReset}
                            disabled={uploadState.isUploading}
                        >
                            🔄 Limpar
                        </button>
                    )}
                    {uploadState.file && !uploadState.result && (
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={uploadState.isUploading || !selectedCollection}
                        >
                            {uploadState.isUploading ? '⏳ Enviando...' : '📤 Fazer Upload'}
                        </button>
                    )}
                    {uploadState.result && (
                        <button
                            className="btn btn-primary"
                            onClick={handleReset}
                        >
                            📁 Enviar outro documento
                        </button>
                    )}
                </div>

                {!selectedCollection && uploadState.file && (
                    <p style={{
                        marginTop: 'var(--spacing-sm)',
                        color: 'var(--color-warning)',
                        fontSize: '0.875rem',
                        textAlign: 'right'
                    }}>
                        ⚠️ Selecione uma coleção para continuar
                    </p>
                )}
            </div>

            {/* Formatos Suportados */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 className="card-title">📋 Formatos Suportados</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-md)'
                }}>
                    {SUPPORTED_FORMATS.filter((f, i, arr) =>
                        arr.findIndex(x => x.label === f.label) === i
                    ).map((format) => (
                        <div
                            key={format.extension}
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>{format.icon}</span>
                            <p style={{
                                marginTop: 'var(--spacing-xs)',
                                fontWeight: 'bold',
                                color: 'var(--color-text-primary)'
                            }}>
                                {format.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DocumentUploader;
