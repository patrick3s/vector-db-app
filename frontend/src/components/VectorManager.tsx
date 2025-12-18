import React, { useState, useEffect, useCallback } from 'react';
import { fetchVectors, saveVector, updateVector, deleteVector, getDocumentDownloadUrl, VectorData } from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface EditModalProps {
    vector: VectorData | null;
    onClose: () => void;
    onSave: (id: string, text: string, metadata?: Record<string, any>) => Promise<void>;
}

interface ViewModalProps {
    vector: VectorData | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

// Componente para renderizar conteúdo com syntax highlighting
interface FormattedContentProps {
    text: string;
}

const FormattedContent: React.FC<FormattedContentProps> = ({ text }) => {
    // Regex para detectar blocos de código markdown: ```linguagem\ncódigo\n```
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        // Adicionar texto antes do bloco de código
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

        // Adicionar bloco de código com syntax highlighting
        parts.push(
            <div key={`code-${keyIndex++}`} className="code-block-container">
                <div className="code-block-header">
                    <span className="code-block-language">{language.toUpperCase()}</span>
                    <button
                        className="code-block-copy"
                        onClick={() => {
                            navigator.clipboard.writeText(code);
                        }}
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

    // Adicionar texto restante após o último bloco de código
    if (lastIndex < text.length) {
        parts.push(
            <span key={`text-${keyIndex++}`} style={{ whiteSpace: 'pre-wrap' }}>
                {text.slice(lastIndex)}
            </span>
        );
    }

    // Se não houver blocos de código, retornar o texto original
    if (parts.length === 0) {
        return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
    }

    return <>{parts}</>;
};

const ViewModal: React.FC<ViewModalProps> = ({ vector, onClose, onEdit, onDelete }) => {
    if (!vector) return null;

    const metadata = vector.metadata || {};
    const hasMetadata = Object.keys(metadata).length > 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">🧠 Detalhes da Memória</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="view-modal-content">
                    {/* ID */}
                    <div className="view-field">
                        <span className="view-field-label">ID</span>
                        <span className="view-field-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {vector.id}
                        </span>
                    </div>

                    {/* Texto completo com syntax highlighting */}
                    <div className="view-field">
                        <span className="view-field-label">📝 Conteúdo</span>
                        <div className="view-field-text">
                            <FormattedContent text={vector.text} />
                        </div>
                    </div>

                    {/* Metadados */}
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

                    {/* Score se existir */}
                    {vector.score !== undefined && (
                        <div className="view-field">
                            <span className="view-field-label">📊 Score de Similaridade</span>
                            <span className="view-field-value" style={{ color: 'var(--color-accent-primary)' }}>
                                {(vector.score * 100).toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onDelete}>
                        🗑️ Excluir
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Fechar
                    </button>
                    <button className="btn btn-primary" onClick={onEdit}>
                        ✏️ Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditModal: React.FC<EditModalProps> = ({ vector, onClose, onSave }) => {
    const [text, setText] = useState(vector?.text || '');
    const [metadata, setMetadata] = useState(JSON.stringify(vector?.metadata || {}, null, 2));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!vector || !text.trim()) return;

        setSaving(true);
        setError(null);

        try {
            let parsedMetadata = {};
            if (metadata.trim()) {
                parsedMetadata = JSON.parse(metadata);
            }
            await onSave(vector.id, text, parsedMetadata);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    if (!vector) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">✏️ Editar Memória</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="form-group">
                    <label className="form-label">ID</label>
                    <input
                        type="text"
                        className="form-input"
                        value={vector.id}
                        disabled
                        style={{ opacity: 0.5 }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Texto</label>
                    <textarea
                        className="form-textarea"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Digite o texto da memória..."
                        rows={5}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Metadados (JSON)</label>
                    <textarea
                        className="form-textarea"
                        value={metadata}
                        onChange={(e) => setMetadata(e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={3}
                        style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                </div>

                {error && (
                    <div className="message message-error">
                        ⚠️ {error}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || !text.trim()}>
                        {saving ? 'Salvando...' : '💾 Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VectorManager: React.FC = () => {
    const [vectors, setVectors] = useState<VectorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Context
    const [user, setUser] = useState('');
    const [collection, setCollection] = useState('');

    // New vector form
    const [newText, setNewText] = useState('');
    const [newMetadata, setNewMetadata] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit modal
    const [editingVector, setEditingVector] = useState<VectorData | null>(null);

    // View modal
    const [viewingVector, setViewingVector] = useState<VectorData | null>(null);

    const loadVectors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchVectors(user || undefined, collection || undefined);
            setVectors(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar memórias');
        } finally {
            setLoading(false);
        }
    }, [user, collection]);

    useEffect(() => {
        loadVectors();
    }, [loadVectors]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim()) return;

        setAdding(true);
        try {
            let metadata: Record<string, any> | undefined;
            if (newMetadata.trim()) {
                metadata = JSON.parse(newMetadata);
            }
            await saveVector(newText, metadata, user || undefined, collection || undefined);
            setNewText('');
            setNewMetadata('');
            showMessage('success', 'Memória adicionada com sucesso!');
            loadVectors();
        } catch (err: any) {
            showMessage('error', err.message || 'Erro ao adicionar memória');
        } finally {
            setAdding(false);
        }
    };

    const handleUpdate = async (id: string, text: string, metadata?: Record<string, any>) => {
        await updateVector(id, text, metadata, user || undefined, collection || undefined);
        showMessage('success', 'Memória atualizada com sucesso!');
        loadVectors();
    };

    const handleDelete = async (vectorId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta memória?')) return;

        try {
            await deleteVector(vectorId, user || undefined, collection || undefined);
            showMessage('success', 'Memória excluída com sucesso!');
            loadVectors();
        } catch (err: any) {
            showMessage('error', err.message || 'Erro ao excluir memória');
        }
    };

    return (
        <div className="app-container">
            <div className="page-header">
                <h1 className="page-title">🧠 Gerenciador de Memórias</h1>
                <p className="page-subtitle">Gerencie suas memórias vetoriais</p>
            </div>

            {/* Context Selector */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">🔧 Contexto</h3>
                    <button className="btn btn-secondary btn-sm" onClick={loadVectors}>
                        🔄 Atualizar
                    </button>
                </div>
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
            </div>

            {/* Message */}
            {message && (
                <div className={`message message-${message.type}`}>
                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                </div>
            )}

            <div className="grid-2">
                {/* Add New Vector */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
                        ➕ Nova Memória
                    </h3>
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label className="form-label">Texto</label>
                            <textarea
                                className="form-textarea"
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                placeholder="Digite o texto que deseja memorizar..."
                                rows={4}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Metadados (JSON, opcional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newMetadata}
                                onChange={(e) => setNewMetadata(e.target.value)}
                                placeholder='{"tag": "importante"}'
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={adding || !newText.trim()}
                            style={{ width: '100%' }}
                        >
                            {adding ? 'Adicionando...' : '💾 Adicionar Memória'}
                        </button>
                    </form>
                </div>

                {/* Vector List */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📚 Memórias ({vectors.length})</h3>
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <span>Carregando memórias...</span>
                        </div>
                    ) : error ? (
                        <div className="message message-error">
                            ⚠️ {error}
                        </div>
                    ) : vectors.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <p className="empty-state-text">Nenhuma memória encontrada</p>
                            <p>Adicione sua primeira memória usando o formulário ao lado.</p>
                        </div>
                    ) : (
                        <div className="vector-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {vectors.map((vector) => {
                                // Extrai campos importantes dos metadados para exibição
                                const metadata = vector.metadata || {};
                                const category = metadata.category || metadata.categoria;
                                const tag = metadata.tag || metadata.tags;
                                const type = metadata.type || metadata.tipo;
                                const source = metadata.source || metadata.fonte;
                                const date = metadata.date || metadata.data || metadata.created_at;

                                // Trunca o texto para exibição breve
                                const maxLength = 120;
                                const truncatedText = vector.text.length > maxLength
                                    ? vector.text.slice(0, maxLength) + '...'
                                    : vector.text;

                                // Conta quantos metadados adicionais existem
                                const otherMetadataCount = Object.keys(metadata).filter(
                                    key => !['category', 'categoria', 'tag', 'tags', 'type', 'tipo', 'source', 'fonte', 'date', 'data', 'created_at'].includes(key)
                                ).length;

                                return (
                                    <div
                                        key={vector.id}
                                        className="vector-item vector-item-clickable"
                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', cursor: 'pointer' }}
                                        onClick={() => setViewingVector(vector)}
                                    >
                                        <div className="vector-item-header" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                                                <span className="vector-id" style={{ fontSize: '0.7rem' }}>#{vector.id.slice(0, 6)}</span>
                                                {category && (
                                                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        📁 {category}
                                                    </span>
                                                )}
                                                {tag && (
                                                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        🏷️ {Array.isArray(tag) ? tag.join(', ') : tag}
                                                    </span>
                                                )}
                                                {/* Document type indicator */}
                                                {metadata.source_type === 'document' && (
                                                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        📎 {(metadata.document_format || '').toUpperCase()}
                                                    </span>
                                                )}
                                                {metadata.is_multipage && (
                                                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        📑 {metadata.total_pages} págs
                                                    </span>
                                                )}
                                                {type && (
                                                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--color-accent)', color: 'white' }}>
                                                        📋 {type}
                                                    </span>
                                                )}
                                                {source && (
                                                    <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)' }}>
                                                        🔗 {source}
                                                    </span>
                                                )}
                                                {date && (
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                                                        📅 {typeof date === 'string' ? date.split('T')[0] : date}
                                                    </span>
                                                )}
                                                {otherMetadataCount > 0 && (
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                                                        +{otherMetadataCount} campos
                                                    </span>
                                                )}
                                            </div>
                                            <div className="vector-actions" onClick={(e) => e.stopPropagation()}>
                                                {metadata.source_type === 'document' && (
                                                    <button
                                                        className="btn btn-secondary btn-icon"
                                                        onClick={async () => {
                                                            try {
                                                                const result = await getDocumentDownloadUrl(vector.id, user || undefined, collection || undefined);
                                                                window.open(result.download_url, '_blank');
                                                            } catch (err) {
                                                                console.error('Erro ao baixar:', err);
                                                            }
                                                        }}
                                                        title={`Baixar ${metadata.document_name || 'documento'}`}
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                    >
                                                        ⬇️
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-secondary btn-icon"
                                                    onClick={() => setEditingVector(vector)}
                                                    title="Editar"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-icon"
                                                    onClick={() => handleDelete(vector.id)}
                                                    title="Excluir"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <p className="vector-text" style={{
                                            fontSize: '0.85rem',
                                            margin: 0,
                                            lineHeight: '1.4',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {truncatedText}
                                        </p>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                            Clique para ver detalhes
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            {viewingVector && (
                <ViewModal
                    vector={viewingVector}
                    onClose={() => setViewingVector(null)}
                    onEdit={() => {
                        setEditingVector(viewingVector);
                        setViewingVector(null);
                    }}
                    onDelete={() => {
                        handleDelete(viewingVector.id);
                        setViewingVector(null);
                    }}
                />
            )}

            {/* Edit Modal */}
            {editingVector && (
                <EditModal
                    vector={editingVector}
                    onClose={() => setEditingVector(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
};

export default VectorManager;
