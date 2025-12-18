# MCP Server para Vector Database

Este servidor MCP (Model Context Protocol) expõe ferramentas para gerenciar um banco de dados vetorial usando Qdrant e Ollama.

## 🚀 Funcionalidades

O servidor MCP oferece as seguintes ferramentas:

### 1. `add_vector`
Adiciona um novo texto ao banco de vetores com embedding gerado automaticamente.

**Parâmetros:**
- `text` (string, obrigatório): O texto a ser armazenado
- `metadata` (object, opcional): Metadados associados ao vetor

**Exemplo:**
```json
{
  "text": "Machine learning é fascinante",
  "metadata": {"category": "AI", "author": "João"}
}
```

### 2. `search_vectors`
Busca vetores similares usando busca semântica.

**Parâmetros:**
- `text` (string, obrigatório): Texto de consulta
- `limit` (integer, opcional): Número máximo de resultados (padrão: 5)

**Exemplo:**
```json
{
  "text": "inteligência artificial",
  "limit": 10
}
```

### 3. `list_all_vectors`
Lista todos os vetores armazenados.

**Parâmetros:** Nenhum

### 4. `delete_vector`
Remove um vetor específico.

**Parâmetros:**
- `vector_id` (string, obrigatório): ID do vetor a remover

### 5. `generate_embedding`
Gera embedding para um texto.

**Parâmetros:**
- `text` (string, obrigatório): Texto para gerar embedding

## 📦 Instalação

1. Instale as dependências:
```bash
cd mcp-server
pip install -r requirements.txt
```

2. Certifique-se de que o Qdrant está rodando:
```bash
cd ../docker
docker-compose up -d qdrant
```

3. Verifique se o Ollama está instalado e o modelo baixado:
```bash
ollama pull nomic-embed-text
```

## 🔧 Configuração

### Para Claude Desktop

Adicione ao arquivo de configuração do Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` no macOS):

```json
{
  "mcpServers": {
    "vector-db": {
      "command": "python",
      "args": [
        "/caminho/completo/para/mcp-memory/vector-db-app/mcp-server/server.py"
      ],
      "env": {
        "QDRANT_HOST": "localhost",
        "QDRANT_PORT": "6333"
      }
    }
  }
}
```

### Para Cline (VS Code)

Adicione ao arquivo de configuração do Cline:

```json
{
  "mcpServers": {
    "vector-db": {
      "command": "python",
      "args": [
        "/caminho/completo/para/mcp-memory/vector-db-app/mcp-server/server.py"
      ],
      "env": {
        "QDRANT_HOST": "localhost",
        "QDRANT_PORT": "6333"
      }
    }
  }
}
```

## 🧪 Testando

Execute o servidor manualmente:
```bash
cd mcp-server
python server.py
```

O servidor aguardará entrada JSON via stdin seguindo o protocolo MCP.

## 🏗️ Arquitetura

```
mcp-server/
├── server.py           # Servidor MCP principal
├── requirements.txt    # Dependências Python
└── README.md          # Esta documentação

backend/
├── src/
│   ├── services/
│   │   ├── vector_db_service.py   # Serviço Qdrant
│   │   └── ollama_service.py      # Serviço Ollama
│   └── ...

docker/
└── docker-compose.yml  # Configuração Qdrant
```

## 📝 Variáveis de Ambiente

- `QDRANT_HOST`: Host do Qdrant (padrão: `localhost`)
- `QDRANT_PORT`: Porta do Qdrant (padrão: `6333`)

## 🤝 Integração com LLMs

Este servidor MCP permite que assistentes de IA (Claude, GPT, etc.) interajam diretamente com seu banco de dados vetorial, possibilitando:

- 📝 Armazenamento de contexto e memória
- 🔍 Busca semântica em conversas anteriores
- 💾 Persistência de conhecimento entre sessões
- 🎯 Recuperação de informações relevantes

## 🔗 Recursos

- [Documentação MCP](https://modelcontextprotocol.io/)
- [Qdrant](https://qdrant.tech/)
- [Ollama](https://ollama.ai/)
