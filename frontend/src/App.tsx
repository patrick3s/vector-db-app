import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useLocation } from 'react-router-dom';
import VectorReader from './components/VectorReader';
import VectorWriter from './components/VectorWriter';
import VectorManager from './components/VectorManager';
import VectorSearch from './components/VectorSearch';
import DocumentUploader from './components/DocumentUploader';
import './styles.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav-container">
      <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
        🏠 Início
      </Link>
      <Link to="/manage" className={`nav-link ${isActive('/manage') ? 'active' : ''}`}>
        🧠 Gerenciar
      </Link>
      <Link to="/upload" className={`nav-link ${isActive('/upload') ? 'active' : ''}`}>
        📁 Upload
      </Link>
      <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`}>
        🔍 Buscar
      </Link>
      <Link to="/read" className={`nav-link ${isActive('/read') ? 'active' : ''}`}>
        📖 Listar
      </Link>
      <Link to="/write" className={`nav-link ${isActive('/write') ? 'active' : ''}`}>
        ✏️ Adicionar
      </Link>
    </nav>
  );
};

// API Endpoint Example Card Component
interface ApiEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  requestExample?: string;
  responseExample?: string;
}

const ApiEndpointCard: React.FC<ApiEndpointProps> = ({ method, endpoint, description, requestExample, responseExample }) => {
  const [expanded, setExpanded] = React.useState(false);

  const methodColors: Record<string, string> = {
    GET: 'var(--color-success)',
    POST: 'var(--color-info)',
    PUT: 'var(--color-warning)',
    DELETE: 'var(--color-error)'
  };

  return (
    <div style={{
      padding: 'var(--spacing-sm)',
      background: 'var(--color-bg-tertiary)',
      borderRadius: 'var(--radius-sm)',
      cursor: requestExample || responseExample ? 'pointer' : 'default'
    }}
      onClick={() => (requestExample || responseExample) && setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <code style={{ color: methodColors[method], fontWeight: 'bold' }}>{method}</code>
          <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>{endpoint}</code>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)', marginBottom: 0 }}>{description}</p>
        </div>
        {(requestExample || responseExample) && (
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {expanded && (requestExample || responseExample) && (
        <div style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-sm)' }}>
          {requestExample && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 'bold' }}>
                📤 Requisição:
              </div>
              <pre style={{
                background: 'var(--color-bg-primary)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                overflow: 'auto',
                margin: 0
              }}>
                <code>{requestExample}</code>
              </pre>
            </div>
          )}
          {responseExample && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 'bold' }}>
                📥 Resposta:
              </div>
              <pre style={{
                background: 'var(--color-bg-primary)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                overflow: 'auto',
                margin: 0
              }}>
                <code>{responseExample}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-title">🧠 Vector DB App</h1>
        <p className="page-subtitle">Sistema de Memória Vetorial com IA</p>
      </div>

      <div className="grid-2">
        <Link to="/manage" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
            <h3 className="card-title">🧠 Gerenciador de Memórias</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)' }}>
              Interface completa para adicionar, editar, visualizar e excluir memórias do banco de vetores.
            </p>
          </div>
        </Link>

        <Link to="/search" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
            <h3 className="card-title">🔍 Busca Semântica</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)' }}>
              Encontre memórias similares usando busca por significado com inteligência artificial.
            </p>
          </div>
        </Link>
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 className="card-title" style={{ textAlign: 'center' }}>📡 API Endpoints</h3>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
          Clique em um endpoint para ver exemplos de requisição e resposta
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--spacing-md)',
          textAlign: 'left'
        }}>
          <ApiEndpointCard
            method="POST"
            endpoint="/vectors"
            description="Adicionar memória"
            requestExample={`POST http://localhost:9000/vectors
Content-Type: application/json

{
  "text": "React é uma biblioteca JavaScript",
  "metadata": {
    "type": "note",
    "language": "javascript"
  },
  "user": "patrick",
  "collection": "memorias"
}`}
            responseExample={`{
  "id": "abc123def456",
  "text": "React é uma biblioteca JavaScript",
  "metadata": {
    "type": "note",
    "language": "javascript"
  },
  "user": "patrick",
  "collection": "memorias"
}`}
          />

          <ApiEndpointCard
            method="POST"
            endpoint="/vectors/search"
            description="Busca semântica"
            requestExample={`POST http://localhost:9000/vectors/search
Content-Type: application/json

{
  "query": "biblioteca para interfaces",
  "limit": 5,
  "user": "patrick",
  "collection": "memorias"
}`}
            responseExample={`[
  {
    "id": "abc123def456",
    "text": "React é uma biblioteca JavaScript",
    "score": 0.92,
    "metadata": {
      "type": "note",
      "language": "javascript"
    }
  },
  {
    "id": "xyz789ghi012",
    "text": "Vue.js é um framework progressivo",
    "score": 0.85,
    "metadata": {...}
  }
]`}
          />

          <ApiEndpointCard
            method="GET"
            endpoint="/vectors"
            description="Listar memórias"
            requestExample={`GET http://localhost:9000/vectors?user=patrick&collection=memorias&limit=10`}
            responseExample={`[
  {
    "id": "abc123def456",
    "text": "React é uma biblioteca JavaScript",
    "metadata": {
      "type": "note",
      "language": "javascript"
    }
  },
  {
    "id": "xyz789ghi012",
    "text": "Vue.js é um framework progressivo",
    "metadata": {...}
  }
]`}
          />

          <ApiEndpointCard
            method="GET"
            endpoint="/collections"
            description="Listar coleções"
            requestExample={`GET http://localhost:9000/collections`}
            responseExample={`[
  {
    "name": "memorias",
    "vectors_count": 42,
    "status": "CollectionStatus.GREEN"
  },
  {
    "name": "notas_flutter",
    "vectors_count": 15,
    "status": "CollectionStatus.GREEN"
  }
]`}
          />

          <ApiEndpointCard
            method="PUT"
            endpoint="/vectors/:id"
            description="Editar memória"
            requestExample={`PUT http://localhost:9000/vectors/abc123def456
Content-Type: application/json

{
  "text": "React é uma biblioteca para UI",
  "metadata": {
    "type": "note",
    "language": "javascript",
    "updated": true
  }
}`}
            responseExample={`{
  "id": "abc123def456",
  "text": "React é uma biblioteca para UI",
  "metadata": {
    "type": "note",
    "language": "javascript",
    "updated": true
  }
}`}
          />

          <ApiEndpointCard
            method="DELETE"
            endpoint="/vectors/:id"
            description="Excluir memória"
            requestExample={`DELETE http://localhost:9000/vectors/abc123def456?user=patrick&collection=memorias`}
            responseExample={`{
  "message": "Memory deleted successfully",
  "deleted_id": "abc123def456"
}`}
          />

          <ApiEndpointCard
            method="POST"
            endpoint="/documents/upload"
            description="Upload de documentos"
            requestExample={`POST http://localhost:9000/documents/upload
Content-Type: multipart/form-data

file: [arquivo.pdf]
user: patrick (opcional)
collection: documentos (opcional)`}
            responseExample={`{
  "message": "Document processed",
  "document_name": "arquivo.pdf",
  "vectors_created": 5,
  "collection": "documentos"
}`}
          />

          <ApiEndpointCard
            method="GET"
            endpoint="/collections/:name"
            description="Info da coleção"
            requestExample={`GET http://localhost:9000/collections/memorias`}
            responseExample={`{
  "name": "memorias",
  "vectors_count": 42,
  "status": "CollectionStatus.GREEN",
  "config": {
    "params": {...}
  }
}`}
          />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Navigation />
      <Switch>
        <Route path="/manage" component={VectorManager} />
        <Route path="/upload" component={DocumentUploader} />
        <Route path="/search" component={VectorSearch} />
        <Route path="/read" component={VectorReader} />
        <Route path="/write" component={VectorWriter} />
        <Route path="/" exact component={Home} />
      </Switch>
    </Router>
  );
};

export default App;