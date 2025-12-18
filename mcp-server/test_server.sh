#!/bin/bash
# Script de teste do servidor MCP

echo "🧪 Testando servidor MCP Vector DB"
echo ""

# Testa inicialização
echo "📋 Teste 1: Inicialização"
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}' | python server.py
echo ""

# Testa listagem de ferramentas
echo "🔧 Teste 2: Listar ferramentas"
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' | python server.py
echo ""

# Testa adicionar vetor
echo "➕ Teste 3: Adicionar vetor"
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "add_vector", "arguments": {"text": "Python é uma linguagem de programação", "metadata": {"category": "tech"}}}}' | python server.py
echo ""

echo "✅ Testes concluídos!"
