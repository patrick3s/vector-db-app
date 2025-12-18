import React, { useState, useEffect } from 'react';
import { saveVector, fetchCollections, createCollection, CollectionInfo } from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Componente de Preview do conteúdo
interface PreviewProps {
    text: string;
}

const ContentPreview: React.FC<PreviewProps> = ({ text }) => {
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
                </div>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        borderRadius: '0 0 8px 8px',
                        fontSize: '0.8rem',
                        maxHeight: '200px',
                    }}
                    showLineNumbers={true}
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
        return <span style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>{text || 'Nada para pré-visualizar...'}</span>;
    }

    return <>{parts}</>;
};

// Templates pré-definidos
const templates = [
    {
        name: '📝 Nota Simples',
        text: '## Título da Nota\n\nConteúdo da sua nota aqui...',
        metadata: { type: 'note' }
    },
    {
        name: '💻 Snippet de Código',
        text: '## Descrição do Código\n\nEste código faz...\n\n```javascript\n// Seu código aqui\nfunction exemplo() {\n    console.log("Hello!");\n}\n```\n\n### Como usar:\n```javascript\nexemplo();\n```',
        metadata: { type: 'code-snippet', language: 'javascript' }
    },
    {
        name: '📋 Padrão/Pattern',
        text: '## Nome do Padrão\n\n### Contexto\nQuando usar este padrão...\n\n### Implementação\n```typescript\n// Código de exemplo\n```\n\n### Benefícios\n- Benefício 1\n- Benefício 2',
        metadata: { type: 'pattern', category: 'design-pattern' }
    },
    {
        name: '📚 Documentação',
        text: '## Título da Documentação\n\n### Descrição\nDescrição detalhada...\n\n### Parâmetros\n| Nome | Tipo | Descrição |\n|------|------|-----------||\n| param1 | string | Descrição |\n\n### Exemplo\n```javascript\n// Exemplo de uso\n```',
        metadata: { type: 'documentation' }
    },
    {
        name: '🐛 Bug/Solução',
        text: '## Problema\nDescrição do bug encontrado...\n\n### Erro\n```\nMensagem de erro aqui\n```\n\n### Causa\nO problema ocorre porque...\n\n### Solução\n```javascript\n// Código corrigido\n```',
        metadata: { type: 'bug-fix', category: 'troubleshooting' }
    }
];

// Sugestões de metadados comuns
const metadataSuggestions = [
    { key: 'type', values: ['note', 'code-snippet', 'pattern', 'documentation', 'bug-fix', 'tutorial', 'reference'] },
    { key: 'category', values: ['ui-component', 'backend', 'frontend', 'database', 'api', 'testing', 'deployment'] },
    { key: 'framework', values: ['react', 'flutter', 'node', 'python', 'typescript'] },
    { key: 'priority', values: ['high', 'medium', 'low'] }
];

const VectorWriter: React.FC = () => {
    // Form state
    const [text, setText] = useState('');
    const [metadataFields, setMetadataFields] = useState<{ key: string; value: string }[]>([]);

    // Collection state
    const [collections, setCollections] = useState<CollectionInfo[]>([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [user, setUser] = useState('');
    const [showNewCollection, setShowNewCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    // UI state
    const [saving, setSaving] = useState(false);
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [creatingCollection, setCreatingCollection] = useState(false);

    // Load collections on mount
    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoadingCollections(true);
        try {
            const data = await fetchCollections();
            setCollections(data);
        } catch (err: any) {
            console.error('Erro ao carregar coleções:', err);
        } finally {
            setLoadingCollections(false);
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;

        setCreatingCollection(true);
        try {
            await createCollection(newCollectionName);
            await loadCollections();
            setSelectedCollection(newCollectionName.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
            setNewCollectionName('');
            setShowNewCollection(false);
            showMessageToast('success', 'Coleção criada com sucesso!');
        } catch (err: any) {
            showMessageToast('error', err.userMessage || err.message || 'Erro ao criar coleção');
        } finally {
            setCreatingCollection(false);
        }
    };

    const showMessageToast = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const addMetadataField = () => {
        setMetadataFields([...metadataFields, { key: '', value: '' }]);
    };

    const removeMetadataField = (index: number) => {
        setMetadataFields(metadataFields.filter((_, i) => i !== index));
    };

    const updateMetadataField = (index: number, field: 'key' | 'value', value: string) => {
        const updated = [...metadataFields];
        updated[index][field] = value;
        setMetadataFields(updated);
    };

    const applyTemplate = (template: typeof templates[0]) => {
        setText(template.text);
        const fields = Object.entries(template.metadata).map(([key, value]) => ({
            key,
            value: String(value)
        }));
        setMetadataFields(fields);
    };

    const buildMetadata = (): Record<string, any> | undefined => {
        const metadata: Record<string, any> = {};
        metadataFields.forEach(field => {
            if (field.key.trim() && field.value.trim()) {
                metadata[field.key.trim()] = field.value.trim();
            }
        });
        return Object.keys(metadata).length > 0 ? metadata : undefined;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) {
            showMessageToast('error', 'Por favor, insira algum conteúdo');
            return;
        }

        setSaving(true);
        try {
            const metadata = buildMetadata();
            await saveVector(
                text,
                metadata,
                user || undefined,
                selectedCollection || undefined
            );

            showMessageToast('success', '✨ Memória salva com sucesso!');
            setText('');
            setMetadataFields([]);
        } catch (err: any) {
            showMessageToast('error', err.userMessage || err.message || 'Erro ao salvar memória');
        } finally {
            setSaving(false);
        }
    };

    const clearForm = () => {
        setText('');
        setMetadataFields([]);
    };

    const wordCount = text.trim().split(/\s+/).filter(w => w).length;
    const charCount = text.length;
    const hasCode = text.includes('```');

    return (
        <div className="app-container">
            <div className="page-header">
                <h1 className="page-title">✏️ Adicionar Memória</h1>
                <p className="page-subtitle">Crie e armazene novas memórias no banco de vetores</p>
            </div>

            {/* Message Toast */}
            {message && (
                <div
                    className={`message message-${message.type}`}
                    style={{
                        marginBottom: 'var(--spacing-md)',
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                </div>
            )}

            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                {/* Left Column - Main Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Collection & User Selector */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
                            📁 Destino da Memória
                        </h3>

                        <div className="context-selector">
                            <div className="context-field">
                                <label>Coleção</label>
                                {loadingCollections ? (
                                    <div style={{ padding: '8px', color: 'var(--color-text-muted)' }}>
                                        Carregando...
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <select
                                            className="form-input"
                                            value={selectedCollection}
                                            onChange={(e) => setSelectedCollection(e.target.value)}
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Selecione ou crie uma coleção</option>
                                            {collections.map(col => (
                                                <option key={col.name} value={col.name}>
                                                    {col.name} ({col.vectors_count} memórias)
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setShowNewCollection(!showNewCollection)}
                                            title="Nova coleção"
                                        >
                                            ➕
                                        </button>
                                    </div>
                                )}

                                {showNewCollection && (
                                    <div style={{
                                        marginTop: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex',
                                        gap: 'var(--spacing-sm)'
                                    }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newCollectionName}
                                            onChange={(e) => setNewCollectionName(e.target.value)}
                                            placeholder="Nome da nova coleção..."
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleCreateCollection}
                                            disabled={creatingCollection || !newCollectionName.trim()}
                                        >
                                            {creatingCollection ? '...' : '✓'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="context-field">
                                <label>Usuário (opcional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
                                    placeholder="Ex: patrick"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Editor */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">📝 Conteúdo</h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {wordCount} palavras · {charCount} caracteres
                                    {hasCode && ' · 💻 Código detectado'}
                                </span>
                                <button
                                    className={`btn btn-sm ${showPreview ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    👁️ {showPreview ? 'Esconder' : 'Preview'}
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <textarea
                                    className="form-textarea"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Digite o conteúdo da memória aqui...

Você pode usar Markdown:
## Títulos
**negrito** e *itálico*

E blocos de código:
```javascript
console.log('Hello World');
```"
                                    rows={12}
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                    }}
                                />
                            </div>

                            {/* Preview */}
                            {showPreview && (
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                        Pré-visualização:
                                    </div>
                                    <ContentPreview text={text} />
                                </div>
                            )}

                            {/* Metadata Section */}
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                    <label className="form-label" style={{ margin: 0 }}>
                                        📋 Metadados (opcional)
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={addMetadataField}
                                    >
                                        ➕ Adicionar campo
                                    </button>
                                </div>

                                {metadataFields.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        Nenhum metadado. Clique em "Adicionar campo" para incluir tags, categorias, etc.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        {metadataFields.map((field, index) => (
                                            <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={field.key}
                                                    onChange={(e) => updateMetadataField(index, 'key', e.target.value)}
                                                    placeholder="Chave (ex: type, category)"
                                                    list={`metadata-keys-${index}`}
                                                    style={{ flex: 1 }}
                                                />
                                                <datalist id={`metadata-keys-${index}`}>
                                                    {metadataSuggestions.map(s => (
                                                        <option key={s.key} value={s.key} />
                                                    ))}
                                                </datalist>

                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={field.value}
                                                    onChange={(e) => updateMetadataField(index, 'value', e.target.value)}
                                                    placeholder="Valor"
                                                    list={`metadata-values-${index}`}
                                                    style={{ flex: 1 }}
                                                />
                                                <datalist id={`metadata-values-${index}`}>
                                                    {metadataSuggestions
                                                        .find(s => s.key === field.key)?.values
                                                        .map(v => <option key={v} value={v} />)
                                                    }
                                                </datalist>

                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => removeMetadataField(index)}
                                                    style={{ padding: '6px 10px' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={clearForm}
                                    disabled={saving}
                                >
                                    🗑️ Limpar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving || !text.trim()}
                                    style={{ flex: 1 }}
                                >
                                    {saving ? (
                                        <>⏳ Salvando...</>
                                    ) : (
                                        <>💾 Salvar Memória</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column - Templates & Help */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Templates */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
                            🎨 Templates Rápidos
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {templates.map((template, index) => (
                                <button
                                    key={index}
                                    className="btn btn-secondary"
                                    onClick={() => applyTemplate(template)}
                                    style={{
                                        textAlign: 'left',
                                        justifyContent: 'flex-start',
                                        padding: 'var(--spacing-sm) var(--spacing-md)'
                                    }}
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Markdown Help */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
                            📖 Dicas de Formatação
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Títulos:</strong>
                                <code style={{ marginLeft: '8px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                                    ## Título
                                </code>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Negrito:</strong>
                                <code style={{ marginLeft: '8px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                                    **texto**
                                </code>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Código inline:</strong>
                                <code style={{ marginLeft: '8px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                                    `código`
                                </code>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Bloco de código:</strong>
                                <pre style={{
                                    background: 'var(--color-bg-tertiary)',
                                    padding: 'var(--spacing-sm)',
                                    borderRadius: '4px',
                                    marginTop: '4px',
                                    fontSize: '0.8rem'
                                }}>
                                    {`\`\`\`javascript
// seu código
\`\`\``}
                                </pre>
                            </div>
                            <div>
                                <strong>Lista:</strong>
                                <code style={{ marginLeft: '8px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                                    - item
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
                            📊 Resumo
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                                    {collections.length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Coleções
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent-secondary)' }}>
                                    {collections.reduce((acc, c) => acc + c.vectors_count, 0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Total de Memórias
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VectorWriter;