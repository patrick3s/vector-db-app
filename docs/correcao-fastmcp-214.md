# Correção FastMCP 2.14.2 - server_fastmcp.py

**Data:** 2026-01-01  
**Projeto:** vector-db-app  
**Arquivo:** `mcp-server/server_fastmcp.py`

## Problema

Ao atualizar para **FastMCP 2.14.2**, o servidor MCP retornava erro 404 ao tentar conectar via SSE:

```
Error POSTing to endpoint (HTTP 404)
SSE error: Non-200 status code (404)
```

O código antigo usava implementação manual com Starlette/uvicorn que não era compatível com a nova versão.

## Solução

Atualizar o código para usar a nova API simplificada do FastMCP 2.x:

1. **Remover** toda a implementação manual com Starlette, SseServerTransport e uvicorn.run()
2. **Usar** simplesmente `mcp.run(transport="sse", host=HOST, port=PORT)` no main()
3. **Mover** parâmetros user/collection para os argumentos das tools ao invés de extrair da URL

## Código Correto (main)

```python
if __name__ == "__main__":
    """Inicia o servidor MCP com FastMCP via HTTP (Streamable)"""
    logger.info(f"Iniciando MCP Server com FastMCP em http://{HOST}:{PORT}")
    logger.info(f"Endpoint MCP: http://{HOST}:{PORT}/mcp")
    logger.info(f"Usuário padrão: {DEFAULT_USER}")
    logger.info(f"Coleção padrão: {DEFAULT_COLLECTION}")
    
    # FastMCP 2.x usa run() com transport="http" ou "sse"
    mcp.run(transport="sse", host=HOST, port=PORT)
```

## Endpoints Disponíveis Após Correção

- **SSE:** `http://localhost:8000/sse`
- **Messages:** `http://localhost:8000/messages/`

## Dependências Necessárias

Adicionar ao `backend/requirements.txt`:
```
fastmcp==2.14.2
```

## Configuração de Launch (VS Code)

Arquivo `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "MCP Server FastMCP",
            "type": "debugpy",
            "request": "launch",
            "program": "${workspaceFolder}/mcp-server/server_fastmcp.py",
            "console": "integratedTerminal",
            "cwd": "${workspaceFolder}/mcp-server",
            "env": {
                "MCP_HOST": "0.0.0.0",
                "MCP_PORT": "8000",
                "PYTHONPATH": "${workspaceFolder}/backend/src"
            },
            "justMyCode": false
        }
    ]
}
```

## Referências

- Documentação FastMCP: https://gofastmcp.com/deployment/running-server
