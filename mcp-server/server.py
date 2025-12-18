#!/usr/bin/env python3
"""
MCP Server para Vector Database
Expõe ferramentas para gerenciar vetores e fazer buscas semânticas
"""

import json
import sys
import os
import logging
from typing import Any, Dict, List

# Configura logging para stderr (não stdout que é usado para MCP)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Adiciona o backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src'))

from services.vector_db_service import get_db_service
from services.ollama_service import OllamaService

# Inicializa os serviços (lazy loading para evitar erros na inicialização)
ollama_service = None
db_service = None

def get_ollama_service():
    global ollama_service
    if ollama_service is None:
        ollama_service = OllamaService()
    return ollama_service


class MCPServer:
    """Servidor MCP simples usando stdio"""
    
    def __init__(self):
        self.tools = self._define_tools()
    
    def _define_tools(self) -> List[Dict[str, Any]]:
        """Define as ferramentas disponíveis"""
        return [
            {
                "name": "add_vector",
                "description": "Adiciona um novo texto ao banco de vetores(memoria). O embedding é gerado automaticamente.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "O texto a ser armazenado"
                        },
                        "metadata": {
                            "type": "object",
                            "description": "Metadados opcionais"
                        }
                    },
                    "required": ["text"]
                }
            },
            {
                "name": "search_vectors",
                "description": "Busca vetores (memoria) similares usando busca semântica",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "Texto de consulta"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Número máximo de resultados",
                            "default": 5
                        }
                    },
                    "required": ["text"]
                }
            },
            {
                "name": "list_all_vectors",
                "description": "Lista todos os vetores armazenados (memoria)",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "delete_vector",
                "description": "Remove um vetor pelo ID (memoria)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "vector_id": {
                            "type": "string",
                            "description": "ID do vetor"
                        }
                    },
                    "required": ["vector_id"]
                }
            }
        ]


    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Processa uma requisição MCP"""
        method = request.get("method", "")
        params = request.get("params", {})
        
        if method == "tools/list":
            return {
                "tools": self.tools
            }
        
        elif method == "tools/call":
            tool_name = params.get("name", "")
            arguments = params.get("arguments", {})
            return self._call_tool(tool_name, arguments)
        
        elif method == "initialize":
            return {
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "vector-db-mcp",
                        "version": "1.0.0"
                    }
                }
            }
        
        return {"error": f"Unknown method: {method}"}
    
    def _call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa uma ferramenta"""
        try:
            logger.info(f"Executando ferramenta: {name}")
            
            if name == "add_vector":
                text = arguments["text"]
                metadata = arguments.get("metadata", {})
                
                ollama = get_ollama_service()
                embedding = ollama.generate_embedding(text)
                db = get_db_service()
                vector_id = db.add_vector(text=text, vector=embedding, metadata=metadata)
                
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "success": True,
                            "id": vector_id,
                            "message": "Vetor adicionado com sucesso",
                            "text": text
                        }, indent=2)
                    }]
                }
            elif name == "search_vectors":
                text = arguments["text"]
                limit = arguments.get("limit", 5)
                
                ollama = get_ollama_service()
                query_embedding = ollama.generate_embedding(text)
                db = get_db_service()
                results = db.search_similar(query_embedding, limit=limit)
                
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "success": True,
                            "query": text,
                            "results_count": len(results),
                            "results": results
                        }, indent=2)
                    }]
                }
            
            elif name == "list_all_vectors":
                db = get_db_service()
                vectors = db.get_all_vectors()
                
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "success": True,
                            "count": len(vectors),
                            "vectors": vectors
                        }, indent=2)
                    }]
                }
            
            elif name == "delete_vector":
                vector_id = arguments["vector_id"]
                db = get_db_service()
                success = db.delete_vector(vector_id)
                
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "success": success,
                            "message": f"Vetor {'removido' if success else 'não encontrado'}"
                        }, indent=2)
                    }]
                }
            
            else:
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "error": f"Ferramenta desconhecida: {name}"
                        }, indent=2)
                    }],
                    "isError": True
                }
        
        except Exception as e:
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "error": str(e)
                    }, indent=2)
                }],
                "isError": True
            }
    
    def run(self):
        """Loop principal do servidor"""
        logger.info("MCP Server iniciado e aguardando requisições...")
        
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
                
            try:
                request = json.loads(line)
                logger.info(f"Requisição recebida: {request.get('method', 'unknown')} (ID: {request.get('id', 'N/A')})")
                logger.debug(f"Requisição completa: {json.dumps(request)}")
                
                result = self.handle_request(request)
                
                # Adiciona o ID da requisição à resposta se for uma requisição com ID
                if "id" in request:
                    # Monta resposta JSON-RPC 2.0 correta
                    if "result" in result:
                        response = {
                            "jsonrpc": "2.0",
                            "id": request["id"],
                            "result": result["result"]
                        }
                    elif "error" in result:
                        response = {
                            "jsonrpc": "2.0",
                            "id": request["id"],
                            "error": result["error"]
                        }
                    else:
                        # Para tools/list e tools/call que retornam o resultado diretamente
                        response = {
                            "jsonrpc": "2.0",
                            "id": request["id"],
                            "result": result
                        }
                    
                    # Envia resposta
                    output = json.dumps(response)
                    logger.debug(f"Resposta JSON: {output}")
                    print(output, flush=True)
                    logger.info(f"Resposta enviada para {request.get('method', 'unknown')} (ID: {request['id']})")
                elif request.get("method") == "notifications/initialized":
                    # Notificações não precisam de resposta
                    logger.info("Notificação initialized recebida")
                    continue
            
            except json.JSONDecodeError as e:
                logger.error(f"Erro ao decodificar JSON: {e}")
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32700,
                        "message": f"Parse error: {str(e)}"
                    }
                }
                print(json.dumps(error_response), flush=True)
            
            except Exception as e:
                logger.error(f"Erro ao processar requisição: {e}", exc_info=True)
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32603,
                        "message": str(e)
                    }
                }
                try:
                    if "id" in request:
                        error_response["id"] = request["id"]
                except:
                    pass
                
                print(json.dumps(error_response), flush=True)


def main():
    """Inicia o servidor MCP"""
    server = MCPServer()
    server.run()


if __name__ == "__main__":
    main()
