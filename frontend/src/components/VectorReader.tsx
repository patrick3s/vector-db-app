import React, { useState, useEffect, useCallback } from 'react';
import {
    fetchCollections,
    fetchVectorsByCollectionName,
    searchVectorsByCollectionName,
    createCollection,
    deleteCollection,
    getDocumentDownloadUrl,
    VectorData,
    CollectionInfo,
    SearchResult
} from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Componente para renderizar conteúdo com syntax highlighting
interface FormattedContentProps {
    text: string;
}

const FormattedContent: React.FC<FormattedContentProps> = ({ text }) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const textBefore = text.slice(lastIndex, match.index);
            parts.push(
                <span key={`text-${keyIndex++}`} style={{ whiteSpace: 'pre-wrap' }}>
                    {textBefore}
                </span>
            );
        }

        const language = match[1] || 'text';
        const code = match[2].trim();

        parts.push(
            <div key={`code-${keyIndex++}`} className="code-block-container">
                <div className="code-block-header">
                    <span className="code-block-language">{language.toUpperCase()}</span>
                    <button
                        className="code-block-copy"
                        onClick={() => navigator.clipboard.writeText(code)}
                        title="Copiar código"
                    >
                        📋 Copiar
                    </button>
                </div>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        borderRadius: '0 0 8px 8px',
                        fontSize: '0.875rem',
                        maxHeight: '400px',
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        );

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(
            <span key={`text-${keyIndex++}`} style={{ whiteSpace: 'pre-wrap' }}>
                {text.slice(lastIndex)}
            </span>
        );
    }

    if (parts.length === 0) {
        return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
    }

    return <>{parts}</>;
};

// Modal de visualização com busca semântica
interface ViewModalProps {
    vector: VectorData | SearchResult;
    collectionName: string;
    onClose: () => void;
    onSearch: (text: string) => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ vector, collectionName, onClose, onSearch }) => {
    const metadata = vector.metadata || {};
    const hasMetadata = Object.keys(metadata).length > 0;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            onSearch(searchQuery);
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">🧠 Detalhes da Memória</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="view-modal-content">
                    {/* Busca semântica */}
                    <div className="view-field" style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
                        <span className="view-field-label">🔍 Buscar Memórias Similares</span>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Digite para buscar memórias relacionadas..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={handleSearch} disabled={!searchQuery.trim()}>
                                🔍 Buscar
                            </button>
                        </div>
                    </div>

                    <div className="view-field">
                        <span className="view-field-label">📁 Coleção</span>
                        <span className="view-field-value" style={{ color: 'var(--color-accent-primary)' }}>
                            {collectionName}
                        </span>
                    </div>

                    <div className="view-field">
                        <span className="view-field-label">ID</span>
                        <span className="view-field-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {vector.id}
                        </span>
                    </div>

                    {'score' in vector && vector.score !== undefined && (
                        <div className="view-field">
                            <span className="view-field-label">📊 Similaridade</span>
                            <span className="view-field-value" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                                {(vector.score * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}

                    <div className="view-field">
                        <span className="view-field-label">📝 Conteúdo</span>
                        <div className="view-field-text">
                            <FormattedContent text={vector.text} />
                        </div>
                    </div>

                    {hasMetadata && (
                        <div className="view-field">
                            <span className="view-field-label">📋 Metadados</span>
                            <div className="view-metadata-grid">
                                {Object.entries(metadata).map(([key, value]) => (
                                    <div key={key} className="view-metadata-item">
                                        <span className="view-metadata-key">{key}</span>
                                        <span className="view-metadata-value">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

const VectorReader: React.FC = () => {
    // State
    const [collections, setCollections] = useState<CollectionInfo[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [vectors, setVectors] = useState<VectorData[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchMode, setIsSearchMode] = useState(false);

    const [loadingCollections, setLoadingCollections] = useState(true);
    const [loadingVectors, setLoadingVectors] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterText, setFilterText] = useState('');

    // View modal
    const [viewingVector, setViewingVector] = useState<VectorData | SearchResult | null>(null);

    // Create/Delete collection
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [creatingCollection, setCreatingCollection] = useState(false);
    const [deletingCollection, setDeletingCollection] = useState<string | null>(null);

    // Load collections on mount
    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoadingCollections(true);
        setError(null);
        try {
            const data = await fetchCollections();
            setCollections(data);
        } catch (err: any) {
            const errorMessage = err.userMessage || err.message || 'Erro ao carregar coleções';
            setError(errorMessage);
        } finally {
            setLoadingCollections(false);
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;

        setCreatingCollection(true);
        setError(null);
        try {
            await createCollection(newCollectionName);
            setSuccessMessage(`Coleção "${newCollectionName}" criada com sucesso!`);
            setNewCollectionName('');
            setShowCreateModal(false);
            await loadCollections();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Erro ao criar coleção';
            setError(errorMsg);
        } finally {
            setCreatingCollection(false);
        }
    };

    const handleDeleteCollection = async (collectionName: string) => {
        if (!window.confirm(`Tem certeza que deseja DELETAR a coleção "${collectionName}"?\n\nEsta ação é IRREVERSÍVEL e todas as memórias serão perdidas!`)) {
            return;
        }

        setDeletingCollection(collectionName);
        setError(null);
        try {
            await deleteCollection(collectionName);
            setSuccessMessage(`Coleção "${collectionName}" deletada com sucesso!`);
            if (selectedCollection === collectionName) {
                setSelectedCollection(null);
                setVectors([]);
            }
            await loadCollections();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Erro ao deletar coleção';
            setError(errorMsg);
        } finally {
            setDeletingCollection(null);
        }
    };

    const loadVectors = useCallback(async (collectionName: string) => {
        setLoadingVectors(true);
        setError(null);
        setIsSearchMode(false);
        setSearchResults([]);
        try {
            const data = await fetchVectorsByCollectionName(collectionName);
            setVectors(data);
        } catch (err: any) {
            const errorMessage = err.userMessage || err.message || 'Erro ao carregar memórias';
            setError(errorMessage);
        } finally {
            setLoadingVectors(false);
        }
    }, []);

    const handleSelectCollection = (collectionName: string) => {
        setSelectedCollection(collectionName);
        setSearchQuery('');
        setFilterText('');
        loadVectors(collectionName);
    };

    const handleSearch = async () => {
        if (!selectedCollection || !searchQuery.trim()) return;

        setSearching(true);
        setError(null);
        try {
            const results = await searchVectorsByCollectionName(selectedCollection, searchQuery, 10);
            setSearchResults(results);
            setIsSearchMode(true);
        } catch (err: any) {
            const errorMessage = err.userMessage || err.message || 'Erro na busca semântica';
            setError(errorMessage);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchFromModal = (query: string) => {
        setSearchQuery(query);
        if (selectedCollection) {
            setSearching(true);
            searchVectorsByCollectionName(selectedCollection, query, 10)
                .then(results => {
                    setSearchResults(results);
                    setIsSearchMode(true);
                })
                .catch(err => {
                    const errorMessage = err.userMessage || err.message || 'Erro na busca';
                    setError(errorMessage);
                })
                .finally(() => setSearching(false));
        }
    };

    const clearSearch = () => {
        setIsSearchMode(false);
        setSearchResults([]);
        setSearchQuery('');
    };

    // Filter vectors by text
    const filteredVectors = vectors.filter(v =>
        !filterText.trim() ||
        v.text.toLowerCase().includes(filterText.toLowerCase()) ||
        v.id.toLowerCase().includes(filterText.toLowerCase())
    );

    const displayVectors = isSearchMode ? searchResults : filteredVectors;

    const truncateText = (text: string, maxLength: number = 150) => {
        const withoutCode = text.replace(/```[\s\S]*?```/g, '[código]');
        return withoutCode.length > maxLength
            ? withoutCode.slice(0, maxLength) + '...'
            : withoutCode;
    };

    return (
        <div className="app-container">
            <div className="page-header">
                <h1 className="page-title">📖 Explorador de Memórias</h1>
                <p className="page-subtitle">Navegue entre coleções e faça buscas semânticas</p>
            </div>

            {/* Mensagens */}
            {successMessage && (
                <div className="message message-success" style={{ marginBottom: 'var(--spacing-md)' }}>
                    ✅ {successMessage}
                </div>
            )}
            {error && (
                <div className="message message-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                    ⚠️ {error}
                    <button
                        onClick={() => setError(null)}
                        style={{ marginLeft: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="grid-2">
                {/* Coluna de Coleções */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📚 Coleções</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                                ➕ Nova
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={loadCollections}>
                                🔄
                            </button>
                        </div>
                    </div>

                    {loadingCollections ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <span>Carregando coleções...</span>
                        </div>
                    ) : collections.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <p className="empty-state-text">Nenhuma coleção encontrada</p>
                            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                ➕ Criar primeira coleção
                            </button>
                        </div>
                    ) : (
                        <div className="vector-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {collections.map((col) => (
                                <div
                                    key={col.name}
                                    className={`vector-item vector-item-clickable ${selectedCollection === col.name ? 'selected' : ''}`}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        background: selectedCollection === col.name ? 'rgba(99, 102, 241, 0.2)' : undefined,
                                        borderColor: selectedCollection === col.name ? 'var(--color-accent-primary)' : undefined
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div
                                            onClick={() => handleSelectCollection(col.name)}
                                            style={{ flex: 1, cursor: 'pointer' }}
                                        >
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                📁 {col.name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {col.vectors_count} memórias
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className={`badge ${col.status === 'CollectionStatus.GREEN' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                                                {col.status === 'CollectionStatus.GREEN' ? '✓' : '?'}
                                            </div>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCollection(col.name);
                                                }}
                                                disabled={deletingCollection === col.name}
                                                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                title="Deletar coleção"
                                            >
                                                {deletingCollection === col.name ? '...' : '🗑️'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Coluna de Memórias */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            {selectedCollection
                                ? `🧠 ${selectedCollection}`
                                : '🧠 Selecione uma coleção'}
                        </h3>
                        {isSearchMode && (
                            <button className="btn btn-secondary btn-sm" onClick={clearSearch}>
                                ✕ Limpar busca
                            </button>
                        )}
                    </div>

                    {selectedCollection && (
                        <>
                            {/* Barra de busca semântica */}
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>
                                    🔍 Busca Semântica (IA)
                                </label>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Descreva o que você procura..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSearch}
                                        disabled={searching || !searchQuery.trim()}
                                    >
                                        {searching ? '...' : '🔍'}
                                    </button>
                                </div>
                            </div>

                            {/* Filtro local */}
                            {!isSearchMode && (
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                        placeholder="Filtrar por texto..."
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            )}

                            {/* Resultados */}
                            {isSearchMode && (
                                <div className="message message-info" style={{ marginBottom: 'var(--spacing-md)' }}>
                                    🎯 {searchResults.length} resultado(s) para: "{searchQuery}"
                                </div>
                            )}
                        </>
                    )}

                    {!selectedCollection ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👈</div>
                            <p className="empty-state-text">Selecione uma coleção</p>
                            <p>Clique em uma coleção à esquerda para ver as memórias</p>
                        </div>
                    ) : loadingVectors ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <span>Carregando memórias...</span>
                        </div>
                    ) : displayVectors.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">{isSearchMode ? '🔍' : '📭'}</div>
                            <p className="empty-state-text">
                                {isSearchMode ? 'Nenhum resultado encontrado' : 'Nenhuma memória nesta coleção'}
                            </p>
                        </div>
                    ) : (
                        <div className="vector-list" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                            {displayVectors.map((vector, index) => {
                                const isDocument = vector.metadata?.source_type === 'document';
                                const docFormat = vector.metadata?.document_format?.toUpperCase() || '';
                                const docIcon = isDocument ? (
                                    docFormat === 'PDF' ? '📕' :
                                        docFormat === 'DOCX' ? '📘' :
                                            docFormat === 'XLSX' || docFormat === 'XLS' ? '📗' :
                                                docFormat === 'CSV' ? '📊' :
                                                    docFormat === 'JSON' ? '📋' : '📄'
                                ) : '🧠';

                                const handleDownload = async (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    try {
                                        const result = await getDocumentDownloadUrl(vector.id, undefined, selectedCollection || undefined);
                                        window.open(result.download_url, '_blank');
                                    } catch (err) {
                                        console.error('Erro ao baixar documento:', err);
                                    }
                                };

                                return (
                                    <div
                                        key={vector.id}
                                        className="vector-item vector-item-clickable"
                                        onClick={() => setViewingVector(vector)}
                                        style={{ padding: 'var(--spacing-md)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '1.2rem' }}>{docIcon}</span>
                                                {isSearchMode && (
                                                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                                        #{index + 1} - {((('score' in vector && vector.score) ? vector.score : 0) * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                    {vector.id.slice(0, 8)}...
                                                </span>
                                                {isDocument && (
                                                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                                                        📎 {docFormat}
                                                    </span>
                                                )}
                                                {vector.metadata?.is_multipage && (
                                                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                                        📑 {vector.metadata.total_pages} págs
                                                    </span>
                                                )}
                                                {vector.text.includes('```') && (
                                                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>💻 Código</span>
                                                )}
                                            </div>
                                            {isDocument && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={handleDownload}
                                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                    title={`Baixar ${vector.metadata?.document_name || 'documento'}`}
                                                >
                                                    ⬇️ Download
                                                </button>
                                            )}
                                        </div>
                                        {isDocument && vector.metadata?.document_name && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', marginBottom: '4px' }}>
                                                📁 {vector.metadata.document_name}
                                            </div>
                                        )}
                                        <p style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            lineHeight: '1.5',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {truncateText(vector.text)}
                                        </p>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                                            {isDocument ? 'Documento vetorizado - clique para detalhes' : 'Clique para ver detalhes e buscar similares'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            {viewingVector && selectedCollection && (
                <ViewModal
                    vector={viewingVector}
                    collectionName={selectedCollection}
                    onClose={() => setViewingVector(null)}
                    onSearch={handleSearchFromModal}
                />
            )}

            {/* Create Collection Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">➕ Nova Coleção</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>

                        <div style={{ padding: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Nome da coleção
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="Ex: memorias_flutter, notas_reuniao..."
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                                autoFocus
                                style={{ width: '100%' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                                O nome será normalizado (sem espaços ou caracteres especiais)
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateCollection}
                                disabled={creatingCollection || !newCollectionName.trim()}
                            >
                                {creatingCollection ? 'Criando...' : '✅ Criar Coleção'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VectorReader;