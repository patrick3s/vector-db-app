# Vector DB Application

Este projeto é uma aplicação que utiliza Docker para facilitar o desenvolvimento e a implantação de um sistema que lê e grava dados em um banco de vetores, integrando com o Olhama.

## Estrutura do Projeto

O projeto é dividido em duas partes principais: **frontend** e **backend**.

### Frontend

A parte frontend é construída com React e TypeScript. Ela é responsável pela interface gráfica da aplicação, permitindo que os usuários leiam e gravem dados no banco de vetores.

- **src/App.tsx**: Ponto de entrada da aplicação frontend.
- **src/components/VectorReader.tsx**: Componente para ler dados do banco de vetores.
- **src/components/VectorWriter.tsx**: Componente para gravar dados no banco de vetores.
- **src/services/api.ts**: Funções para interagir com a API do backend.
- **src/index.tsx**: Inicializa a aplicação React.

### Backend

A parte backend é construída com Python e FastAPI. Ela gerencia as operações de leitura e gravação no banco de vetores e a comunicação com o Ollama.

- **src/app.py**: Ponto de entrada da aplicação backend com FastAPI.
- **src/routes/vectors.py**: Define as rotas da API para operações de leitura e gravação.
- **src/services/ollama_service.py**: Funções para interagir com o Ollama e gerar embeddings.
- **src/services/vector_db_service.py**: Funções para gerenciar operações no Qdrant.
- **src/config.py**: Configurações e variáveis de ambiente.

Para executar o backend localmente sem Docker:
```bash
cd backend
pip install -r requirements.txt
uvicorn src.app:app --host 0.0.0.0 --port 9000 --reload
```

### MCP Server

Servidor MCP (Model Context Protocol) que expõe ferramentas para LLMs interagirem com o banco de vetores.

- **server.py**: Servidor MCP principal
- **README.md**: Documentação completa do MCP
- **install.sh**: Script de instalação
- **test_server.sh**: Script de teste

**Ferramentas disponíveis:**
- `add_vector`: Adiciona texto ao banco de vetores
- `search_vectors`: Busca semântica por similaridade
- `list_all_vectors`: Lista todos os vetores
- `delete_vector`: Remove um vetor

Para configurar com Claude Desktop:
```bash
cd mcp-server
./install.sh
```

### Docker

O projeto utiliza Docker para facilitar a execução e o gerenciamento dos serviços.

- **Dockerfile.frontend**: Instruções para construir a imagem Docker do frontend.
- **Dockerfile.backend**: Instruções para construir a imagem Docker do backend.
- **docker-compose.yml**: Define os serviços Docker para o frontend e o backend.

## Instalação

1. Clone o repositório:
   ```
   git clone <URL_DO_REPOSITORIO>
   cd vector-db-app
   ```

2. Configure as variáveis de ambiente:
   - Renomeie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme necessário.

3. Construa e inicie os serviços usando Docker Compose:
   ```
   docker-compose up --build
   ```

## Uso

Após a inicialização dos serviços, você pode acessar a aplicação frontend em `http://localhost:3000`. Utilize a interface para ler e gravar dados no banco de vetores.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.