#!/bin/bash
# Script de instalação do servidor MCP

echo "🚀 Instalando Vector DB MCP Server"
echo ""

# Verifica Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3."
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"

# Verifica Qdrant
echo ""
echo "🔍 Verificando Qdrant..."
if curl -s http://localhost:6333/healthz > /dev/null 2>&1; then
    echo "✅ Qdrant está rodando"
else
    echo "⚠️  Qdrant não está rodando. Inicie com:"
    echo "   cd ../docker && docker-compose up -d qdrant"
fi

# Verifica Ollama
echo ""
echo "🔍 Verificando Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama instalado"
    
    # Verifica modelo
    if ollama list | grep -q "nomic-embed-text"; then
        echo "✅ Modelo nomic-embed-text disponível"
    else
        echo "⚠️  Modelo nomic-embed-text não encontrado. Instalando..."
        ollama pull nomic-embed-text
    fi
else
    echo "❌ Ollama não encontrado. Instale em: https://ollama.ai"
    exit 1
fi

# Instala dependências Python
echo ""
echo "📦 Instalando dependências Python..."
cd "$(dirname "$0")"
if [ -f "../.venv/bin/activate" ]; then
    source ../.venv/bin/activate
    echo "✅ Ambiente virtual ativado"
else
    echo "⚠️  Ambiente virtual não encontrado. Instalando globalmente..."
fi

pip install -q -r requirements.txt
echo "✅ Dependências instaladas"

# Configuração do Claude Desktop
echo ""
echo "📝 Configuração do Claude Desktop:"
echo ""
echo "Adicione ao arquivo de configuração do Claude Desktop:"
echo "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
cat claude_desktop_config.json
echo ""

echo "✅ Instalação concluída!"
echo ""
echo "🧪 Para testar: ./test_server.sh"
echo "🚀 Para usar com Claude Desktop, adicione a configuração acima"
