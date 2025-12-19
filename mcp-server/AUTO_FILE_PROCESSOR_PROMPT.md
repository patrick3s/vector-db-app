# 🤖 Prompt Inteligente: Processador Automático de Arquivos para Memória

Este é um prompt completo que você pode usar para processar automaticamente uma lista de arquivos e armazená-los no sistema de memória MCP de forma inteligente.

---

## 📋 Prompt para o Claude Desktop

Copie e cole este prompt completo:

```
Você tem acesso ao sistema de memória MCP avançado. Vou te dar um arquivo README.md com uma checklist de paths de arquivos do projeto. Sua missão é processar cada arquivo de forma inteligente:

## INSTRUÇÕES DETALHADAS:

### 1. LEITURA DO CHECKLIST
- Leia o arquivo README.md (ou arquivo de checklist que eu fornecer)
- Identifique todos os paths de arquivos listados
- Extraia o caminho completo de cada arquivo

### 2. ANÁLISE DE CADA ARQUIVO
Para CADA arquivo na lista:

a) **Leia o arquivo completo**
   - Use ferramentas de leitura disponíveis

b) **Analise o tipo de conteúdo e classifique:**

   **CÓDIGO (arquivos .py, .ts, .js, .tsx, etc.):**
   - Identifique decisões arquiteturais
   - Identifique padrões de design usados
   - Identifique dependências importantes
   - Identifique configurações críticas
   
   **CONFIGURAÇÃO (.json, .yaml, .env, etc.):**
   - Identifique configurações de ambiente
   - Identifique integrações externas (APIs, DBs)
   - Identifique credenciais/secrets (NÃO armazene valores)
   
   **DOCUMENTAÇÃO (.md, .txt, etc.):**
   - Identifique decisões de projeto
   - Identifique requisitos importantes
   - Identifique guidelines e padrões

c) **Extraia informações valiosas:**
   - Decisões técnicas: "Decidido usar React + TypeScript"
   - Padrões: "Usa padrão Repository para acesso a dados"
   - Configurações: "API rodando na porta 9000"
   - Dependências: "Integra com Qdrant e Ollama"

### 3. ARMAZENAMENTO INTELIGENTE NA MEMÓRIA

Para cada informação valiosa extraída, use `memory_store_candidate`:

```json
{
  "user_id": "patrick",
  "session_id": "file_processing_session",
  "text": "INFORMAÇÃO EXTRAÍDA EM TEXTO CLARO",
  "source": "CAMINHO_DO_ARQUIVO",
  "timestamp": "ISO_TIMESTAMP"
}
```

**REGRAS DE CLASSIFICAÇÃO AUTOMÁTICA:**

A ferramenta `memory_store_candidate` vai classificar automaticamente:

- **Decisões arquiteturais** → type: "decision", importance: 2-3, ttl_days: 365+
  Exemplo: "Decidido usar FastMCP para servidor MCP"

- **Configurações críticas** → type: "fact", importance: 2, ttl_days: 180
  Exemplo: "Servidor MCP roda na porta 8000"

- **Padrões de código** → type: "note", importance: 1-2, ttl_days: 180
  Exemplo: "Usa Qdrant para armazenamento vetorial"

- **Dependências importantes** → type: "fact", importance: 1-2, ttl_days: 180
  Exemplo: "Integração com Ollama para embeddings"

- **Guidelines de projeto** → type: "decision", importance: 2, ttl_days: 365
  Exemplo: "Sempre usar TypeScript para novo código"

### 4. FORMATO DE SAÍDA

Ao final do processamento, me forneça um relatório:

```
# RELATÓRIO DE PROCESSAMENTO

## Arquivos Processados: X
## Memórias Armazenadas: Y

### Resumo por Tipo:
- Decisões (decision): N memórias
- Fatos (fact): N memórias  
- Notas (note): N memórias
- Tarefas (task): N memórias

### Destaques (Top 5 mais importantes):
1. [mem:id] - Descrição breve
2. [mem:id] - Descrição breve
...

### Arquivos Processados:
- ✅ /path/to/file1.py - 3 memórias armazenadas
- ✅ /path/to/file2.ts - 2 memórias armazenadas
- ⚠️ /path/to/file3.md - 0 memórias (sem conteúdo relevante)

### Próximos Passos Sugeridos:
- Sugestões baseadas nas memórias encontradas
```

## EXEMPLO PRÁTICO:

Se você encontrar este código:

```python
# server_fastmcp.py
OLLAMA_CHAT_MODEL = "qwen3:4b-instruct"
PORT = int(os.getenv("MCP_PORT", "8000"))

@mcp.tool()
def memory_store_candidate(user_id, text, source):
    # Armazena memória com classificação LLM
    ...
```

Você deve extrair e armazenar:

1. "Projeto usa modelo qwen3:4b-instruct para chat LLM"
   - source: "server_fastmcp.py"
   - tipo esperado: decision

2. "Servidor MCP configurado para rodar na porta 8000 por padrão"
   - source: "server_fastmcp.py"  
   - tipo esperado: fact

3. "Sistema implementa memória com classificação automática via LLM"
   - source: "server_fastmcp.py"
   - tipo esperado: decision

## AGORA ME FORNEÇA O CHECKLIST OU README.md

Estou pronto para processar! Me envie:
- O arquivo com a checklist de paths, OU
- A lista direta de arquivos para processar

Vou analisar cada um e armazenar as informações importantes na memória para você.
```

---

## 📝 Exemplo de Arquivo Checklist

Crie um arquivo `files_to_process.md`:

```markdown
# Arquivos para Processar

## Backend
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/backend/src/app.py
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/backend/src/services/vector_db_service.py
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/backend/src/services/ollama_service.py

## MCP Server
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/mcp-server/server_fastmcp.py
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/mcp-server/memory_helpers.py

## Frontend
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/frontend/src/App.tsx
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/frontend/package.json

## Configuração
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/docker-compose.yml
- [ ] /Users/patricksouzasilva/Documents/projetos/vector-db-app/.env.example
```

---

## 🚀 Como Usar

### Opção 1: Simples (Recomendado)

1. **Cole o prompt acima no Claude Desktop**
2. **Forneça a lista de arquivos:**
   ```
   Processe estes arquivos:
   - /path/to/server_fastmcp.py
   - /path/to/vector_db_service.py
   - /path/to/memory_helpers.py
   ```
3. **Claude vai automaticamente:**
   - Ler cada arquivo
   - Analisar o conteúdo
   - Extrair informações valiosas
   - Armazenar via `memory_store_candidate`
   - Gerar relatório completo

### Opção 2: Com Checklist

1. **Crie arquivo `files_to_process.md`**
2. **Cole o prompt no Claude**
3. **Envie o arquivo:**
   ```
   Processe todos os arquivos listados em:
   /path/to/files_to_process.md
   ```

---

## 💡 O Que Acontece Automaticamente

### Durante o Processamento:

Para cada arquivo, o Claude vai:

1. **Ler** o conteúdo completo
2. **Analisar** e identificar:
   - Decisões técnicas
   - Configurações importantes
   - Padrões de design
   - Dependências
   - Integrações

3. **Extrair** informações em linguagem natural:
   - ❌ NÃO: `OLLAMA_CHAT_MODEL = "qwen3:4b-instruct"`
   - ✅ SIM: "Projeto usa qwen3:4b-instruct como modelo LLM para chat"

4. **Armazenar** via `memory_store_candidate`:
   ```python
   memory_store_candidate({
     "user_id": "patrick",
     "text": "Projeto usa qwen3:4b-instruct como modelo LLM",
     "source": "server_fastmcp.py",
     ...
   })
   ```

5. **Classificar** automaticamente (via LLM interno):
   - type: decision/fact/note/task
   - importance: 0-3
   - ttl_days: baseado no tipo

### Após o Processamento:

Você terá:
- ✅ Todas as decisões arquiteturais armazenadas
- ✅ Configurações importantes documentadas
- ✅ Padrões de código identificados
- ✅ Dependências mapeadas
- ✅ Relatório completo do que foi encontrado

---

## 🎯 Benefícios

### Antes (Manual):
```
Você: "Qual porta o MCP server usa?"
Claude: "Não sei, preciso ver o código..."
```

### Depois (Com Memórias):
```
Você: "Qual porta o MCP server usa?"
Claude: "O servidor MCP usa porta 8000 [mem:abc123], 
configurado em server_fastmcp.py"
```

### Casos de Uso:

1. **Onboarding de projeto:**
   - Processa todos os arquivos uma vez
   - Sistema "aprende" a arquitetura
   - Novas perguntas já têm contexto

2. **Documentação automática:**
   - Extrai decisões técnicas
   - Mapeia integrações
   - Identifica configurações

3. **Knowledge base:**
   - Buscar "decisões de autenticação"
   - Buscar "configurações de banco de dados"
   - Buscar "padrões de código"

4. **Consistência:**
   - "Qual modelo LLM usamos?"
   - "Qual a porta do backend?"
   - "Quais dependências principais?"

---

## 🔍 Exemplo Real Completo

### Input: Lista de Arquivos

```markdown
Processe:
- /projeto/server_fastmcp.py
- /projeto/vector_db_service.py
- /projeto/docker-compose.yml
```

### Processamento Automático:

**Arquivo 1: server_fastmcp.py**
```python
OLLAMA_CHAT_MODEL = "qwen3:4b-instruct"
PORT = 8000

@mcp.tool()
def memory_store_candidate(...):
    # Memory gate with LLM
```

**Extrações:**
1. ✅ "Sistema usa qwen3:4b-instruct para classificação de memórias"
2. ✅ "Servidor MCP roda na porta 8000"
3. ✅ "Implementa Memory Gate com classificação automática via LLM"

**Arquivo 2: vector_db_service.py**
```python
from qdrant_client import QdrantClient

class VectorDBService:
    def __init__(self):
        self.client = QdrantClient(host="localhost", port=6333)
        self.collection_name = "vectors"
```

**Extrações:**
1. ✅ "Usa Qdrant como banco de dados vetorial"
2. ✅ "Qdrant configurado em localhost:6333"
3. ✅ "Coleção padrão chamada 'vectors'"

**Arquivo 3: docker-compose.yml**
```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
```

**Extrações:**
1. ✅ "Projeto usa Docker Compose para orquestração"
2. ✅ "Qdrant exposto na porta 6333"
3. ✅ "Ollama exposto na porta 11434"

### Output: Relatório

```
# RELATÓRIO DE PROCESSAMENTO

## Arquivos Processados: 3
## Memórias Armazenadas: 9

### Resumo por Tipo:
- Decisões (decision): 3 memórias
- Fatos (fact): 5 memórias  
- Notas (note): 1 memória

### Destaques (Top 5):
1. [mem:a1b2c3] - Sistema usa qwen3:4b-instruct para classificação
2. [mem:d4e5f6] - Usa Qdrant como banco de dados vetorial
3. [mem:g7h8i9] - Memory Gate com classificação automática LLM
4. [mem:j0k1l2] - Projeto usa Docker Compose para stack
5. [mem:m3n4o5] - Ollama exposto na porta 11434

### Arquivos Processados:
✅ server_fastmcp.py - 3 memórias
✅ vector_db_service.py - 3 memórias
✅ docker-compose.yml - 3 memórias

### Próximos Passos:
- Todas as configurações críticas foram mapeadas
- Decisões arquiteturais documentadas
- Pronto para responder perguntas sobre a stack
```

---

## 🎓 Dicas Avançadas

### 1. Processar Apenas Arquivos Novos

```
Processe apenas arquivos modificados nos últimos 7 dias em:
/path/to/project
```

### 2. Focar em Tipo Específico

```
Processe todos os arquivos de configuração (.json, .yaml, .env) 
e extraia apenas configurações de ambiente e integrações.
```

### 3. Update/Refresh de Memórias

```
Reprocesse server_fastmcp.py para atualizar memórias sobre 
as novas ferramentas MCP adicionadas.
```

### 4. Análise Comparativa

```
Processe backend/app.py e frontend/App.tsx e identifique
diferenças nas decisões de autenticação entre frontend e backend.
```

---

## ⚙️ Configurações Opcionais

Você pode customizar o comportamento:

### Filtrar por Tipo de Memória

```
Ao processar, armazene apenas:
- Decisões arquiteturais (importance >= 2)
- Ignore configurações temporárias
```

### Ajustar TTL

```
Para este projeto:
- Decisões: ttl_days = 365 (permanente)
- Configurações: ttl_days = 90 (podem mudar)
- Notas: ttl_days = 30 (referência temporária)
```

### Source Tagging

```
Adicione prefixo no source:
- "backend:" para arquivos backend
- "frontend:" para arquivos frontend
- "config:" para configurações
```

---

## 🚀 Comece Agora

1. **Copie o prompt principal** (primeira seção)
2. **Cole no Claude Desktop**
3. **Forneça a lista de arquivos**
4. **Aguarde o relatório**
5. **Agora seu sistema tem memória completa do projeto!**

Qualquer pergunta futura sobre decisões, configurações ou arquitetura será respondida automaticamente usando as memórias armazenadas! 🎉
