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

      <div className="card" style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h3 className="card-title">📡 API Endpoints</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-md)',
          textAlign: 'left'
        }}>
          <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <code style={{ color: 'var(--color-success)' }}>GET</code>
            <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>/vectors</code>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>Listar memórias</p>
          </div>
          <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <code style={{ color: 'var(--color-info)' }}>POST</code>
            <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>/vectors</code>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>Adicionar memória</p>
          </div>
          <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <code style={{ color: 'var(--color-warning)' }}>PUT</code>
            <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>/vectors/:id</code>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>Editar memória</p>
          </div>
          <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <code style={{ color: 'var(--color-error)' }}>DELETE</code>
            <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>/vectors/:id</code>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>Excluir memória</p>
          </div>
          <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <code style={{ color: 'var(--color-info)' }}>POST</code>
            <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>/vectors/search</code>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>Busca semântica</p>
          </div>
          <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <code style={{ color: 'var(--color-success)' }}>GET</code>
            <code style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>/vectors/context</code>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>Info da coleção</p>
          </div>
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