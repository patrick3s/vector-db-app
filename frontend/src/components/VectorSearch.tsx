import React, { useState } from 'react';
import { searchVectors, getDocumentDownloadUrl, SearchResult } from '../services/api';

const VectorSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState(5);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Context
    const [user, setUser] = useState('');
    const [collection, setCollection] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const data = await searchVectors(query, limit, user || undefined, collection || undefined);
            setResults(data);
        } catch (err: any) {
            // Usa userMessage se for ApiError, senão usa message padrão
            const errorMessage = err.userMessage || err.message || 'Erro ao buscar memórias';
            setError(errorMessage);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 0.8) return 'var(--color-success)';
        if (score >= 0.6) return 'var(--color-accent-primary)';
        if (score >= 0.4) return 'var(--color-warning)';
        return 'var(--color-text-muted)';
    };

    return (
        <div className="app-container">
            <div className="page-header">
                <h1 className="page-title">🔍 Busca Semântica</h1>
                <p className="page-subtitle">Encontre memórias similares usando IA</p>
            </div>

            {/* Context & Search Form */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
                    🎯 Parâmetros de Busca
                </h3>

                <div className="context-selector">
                    <div className="context-field">
                        <label>Usuário</label>
                        <input
                            type="text"
                            className="form-input"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            placeholder="Ex: patrick"
                        />
                    </div>
                    <div className="context-field">
                        <label>Coleção</label>
                        <input
                            type="text"
                            className="form-input"
                            value={collection}
                            onChange={(e) => setCollection(e.target.value)}
                            placeholder="Ex: memorias"
                        />
                    </div>
                </div>

                <form onSubmit={handleSearch}>
                    <div className="form-group">
                        <label className="form-label">Consulta</label>
                        <textarea
                            className="form-textarea"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Digite o texto para buscar memórias similares..."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                            Limite de resultados:
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{
                            minWidth: '30px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: 'var(--color-accent-primary)'
                        }}>
                            {limit}
                        </span>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !query.trim()}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Buscando...' : '🔍 Buscar Memórias'}
                    </button>
                </form>
            </div>

            {/* Results */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        📊 Resultados {hasSearched && `(${results.length})`}
                    </h3>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Buscando memórias similares...</span>
                    </div>
                ) : error ? (
                    <div className="message message-error">
                        ⚠️ {error}
                    </div>
                ) : !hasSearched ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🧭</div>
                        <p className="empty-state-text">Digite uma consulta para buscar</p>
                        <p>A busca semântica encontrará memórias com significado similar.</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔎</div>
                        <p className="empty-state-text">Nenhum resultado encontrado</p>
                        <p>Tente uma consulta diferente ou verifique o contexto.</p>
                    </div>
                ) : (
                    <div className="vector-list">
                        {results.map((result, index) => {
                            const isDocument = result.metadata?.source_type === 'document';
                            const docFormat = result.metadata?.document_format?.toUpperCase() || '';
                            const docIcon = isDocument ? (
                                docFormat === 'PDF' ? '📕' :
                                    docFormat === 'DOCX' ? '📘' :
                                        docFormat === 'XLSX' || docFormat === 'XLS' ? '📗' :
                                            docFormat === 'CSV' ? '📊' :
                                                docFormat === 'JSON' ? '📋' : '📄'
                            ) : '🧠';

                            const handleDownload = async () => {
                                try {
                                    const downloadResult = await getDocumentDownloadUrl(
                                        result.id,
                                        user || undefined,
                                        collection || undefined
                                    );
                                    window.open(downloadResult.download_url, '_blank');
                                } catch (err) {
                                    console.error('Erro ao baixar documento:', err);
                                }
                            };

                            return (
                                <div key={result.id} className="search-result">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                                        <div className="search-score">
                                            <span style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                                color: getScoreColor(result.score)
                                            }}>
                                                {docIcon} #{index + 1}
                                            </span>
                                            <span style={{ color: getScoreColor(result.score) }}>
                                                {(result.score * 100).toFixed(1)}% similar
                                            </span>
                                            <div className="search-score-bar">
                                                <div
                                                    className="search-score-fill"
                                                    style={{
                                                        width: `${result.score * 100}%`,
                                                        background: getScoreColor(result.score)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="vector-id">{result.id.slice(0, 8)}...</span>
                                            {isDocument && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={handleDownload}
                                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                    title={`Baixar ${result.metadata?.document_name || 'documento'}`}
                                                >
                                                    ⬇️ Download
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isDocument && result.metadata?.document_name && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: 'var(--spacing-sm)',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-accent-primary)'
                                        }}>
                                            📁 {result.metadata.document_name}
                                            {result.metadata.is_multipage && (
                                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                                    📑 {result.metadata.total_pages} págs
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <p className="vector-text">{result.text}</p>

                                    {result.metadata && Object.keys(result.metadata).length > 0 && (
                                        <div className="vector-metadata">
                                            <div className="vector-metadata-label">Metadados</div>
                                            <div className="vector-metadata-content">
                                                {JSON.stringify(result.metadata)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VectorSearch;
