# 🧠 Guia de Uso Inteligente do MCP - Vector DB & Memory System

Este guia orienta como usar todas as ferramentas MCP de forma otimizada para máximo aproveitamento.

## 📋 Ferramentas Disponíveis

### Ferramentas Básicas de Vetores
1. `add_vector` - Adiciona texto ao banco vetorial
2. `search_vectors` - Busca semântica simples
3. `list_all_vectors` - Lista todos os vetores
4. `delete_vector` - Remove vetor por ID

### Sistema de Memória Avançado
5. `memory_store_candidate` - Memory Gate com classificação LLM
6. `memory_rewrite_query` - Reescreve queries e extrai filtros
7. `memory_search` - Busca semântica avançada com TTL
8. `memory_rerank` - Re-ranking LLM por relevância
9. `memory_pack` - Empacota memórias formatadas

### Geração de Prompts
10. `generate_screen_prompt` - Gera prompts para criar telas/UIs

---

## 🎯 Workflows Inteligentes Recomendados

### Workflow 1: Armazenamento Inteligente de Conversas

**Quando usar:** Durante conversas com o usuário, armazene informações importantes automaticamente.

**Fluxo:**
```
Conversação → Detectar informação valiosa → memory_store_candidate
```

**Exemplo:**
```
Usuário diz: "Prefiro sempre usar dark mode nas minhas aplicações"

Ação:
memory_store_candidate({
  "user_id": "patrick",
  "session_id": "session_2024_12_19",
  "text": "Prefiro sempre usar dark mode nas minhas aplicações",
  "source": "chat",
  "timestamp": "2024-12-19T13:00:00Z"
})

O LLM classificará como:
- type: "preference"
- importance: 2
- ttl_days: 365
- Filtrará automaticamente se for smalltalk
```

**Gatilhos para armazenar:**
- ✅ Preferências ("Prefiro X", "Gosto de Y")
- ✅ Decisões ("Vamos usar React", "Decidi implementar auth com JWT")
- ✅ Tarefas ("Preciso criar o dashboard", "Tenho que revisar o código")
- ✅ Fatos importantes ("A API usa porta 9000", "O banco é PostgreSQL")
- ❌ Smalltalk ("Olá", "Obrigado", "Tudo bem?")

---

### Workflow 2: Busca Contextual Inteligente

**Quando usar:** Quando o usuário faz perguntas sobre preferências, decisões ou contexto passado.

**Fluxo Completo (Pipeline de Memória):**
```
Query → memory_rewrite_query → memory_search → memory_rerank → memory_pack → Resposta
```

**Exemplo Passo a Passo:**

1. **Usuário pergunta:** "Quais são minhas preferências de UI?"

2. **Rewrite Query:**
```javascript
memory_rewrite_query({
  user_id: "patrick",
  query: "Quais são minhas preferências de UI?",
  k: 5
})

// Retorna:
{
  rewritten_queries: [
    "preferências de UI",
    "preferências de interface",
    "gostos de design",
    "configurações de visualização"
  ],
  filters: {
    type_any: ["preference"],
    min_importance: 1
  }
}
```

3. **Search com filtros:**
```javascript
memory_search({
  user_id: "patrick",
  query: "preferências de UI",
  filters: { type_any: ["preference"], min_importance: 1 },
  k: 5
})

// Retorna candidatos relevantes
```

4. **Rerank para refinar:**
```javascript
memory_rerank({
  query: "preferências de UI",
  candidates: [...], // do memory_search
  top_n: 3
})

// Seleciona os 3 mais relevantes com justificativa
```

5. **Pack para formatar:**
```javascript
memory_pack({
  query: "preferências de UI",
  selected: [...], // do memory_rerank
  max_tokens_hint: 500
})

// Retorna contexto formatado:
{
  memory_context: [
    "mem:abc123 - Usuário prefere dark mode em todas as aplicações",
    "mem:def456 - Gosta de interfaces minimalistas",
    "mem:ghi789 - Prefere layouts responsivos mobile-first"
  ],
  citations: ["mem:abc123", "mem:def456", "mem:ghi789"]
}
```

6. **Responda usando o contexto:**
```
Com base nas suas memórias:
- Você prefere dark mode em todas as aplicações [mem:abc123]
- Gosta de interfaces minimalistas [mem:def456]
- Prefere layouts responsivos mobile-first [mem:ghi789]
```

---

### Workflow 3: Geração de Telas com Contexto

**Quando usar:** Usuário pede para criar uma tela/interface.

**Fluxo:**
```
Pedido de tela → generate_screen_prompt (com memórias) → Usar full_prompt → Gerar código
```

**Exemplo:**

1. **Usuário:** "Crie uma tela de login para mim"

2. **Gerar prompt inteligente:**
```javascript
generate_screen_prompt({
  user_id: "patrick",
  screen_description: "Tela de login moderna e segura",
  tech_stack: "React + TypeScript + TailwindCSS",
  style_preferences: "minimalista",
  include_user_memories: true  // Busca preferências de UI automaticamente
})

// O sistema:
// 1. Busca suas preferências (dark mode, minimalista, etc.)
// 2. Gera prompt estruturado
// 3. Retorna full_prompt otimizado
```

3. **Usar o full_prompt retornado** para gerar o código da tela considerando:
   - Suas preferências de dark mode
   - Seu gosto por minimalismo
   - Stack técnico definido
   - Best practices de acessibilidade

---

### Workflow 4: Onboarding de Projeto

**Quando usar:** Início de novo projeto ou nova funcionalidade.

**Fluxo:**
```
Decisões → Armazenar → Consultar depois
```

**Exemplo:**

**Durante planejamento:**
```javascript
// Armazenar decisões arquiteturais
memory_store_candidate({
  user_id: "patrick",
  text: "Decidimos usar Next.js 14 com App Router para o projeto de e-commerce",
  source: "project_planning"
})

memory_store_candidate({
  user_id: "patrick",
  text: "Autenticação será com NextAuth.js usando providers Google e GitHub",
  source: "architecture_decision"
})

memory_store_candidate({
  user_id: "patrick",
  text: "Banco de dados: PostgreSQL com Prisma ORM",
  source: "tech_decision"
})
```

**Semanas depois, ao codificar:**
```javascript
memory_search({
  user_id: "patrick",
  query: "decisões de autenticação do projeto",
  filters: { type_any: ["decision"], time_range_days: 60 }
})

// Recupera: "Autenticação será com NextAuth.js..."
```

---

### Workflow 5: Detecção Automática de Contexto

**Quando usar:** Sempre que o usuário mencionar algo importante.

**Regras de Detecção:**

| Frase do usuário | Ação | Tipo |
|------------------|------|------|
| "Prefiro...", "Gosto de..." | `memory_store_candidate` | preference |
| "Vamos usar...", "Decidimos..." | `memory_store_candidate` | decision |
| "Preciso fazer...", "Tenho que..." | `memory_store_candidate` | task |
| "O sistema usa...", "A API funciona..." | `memory_store_candidate` | fact |
| "Lembrando que...", "Importante:" | `memory_store_candidate` | note |

**Exemplo de Conversa com Armazenamento Automático:**

```
Usuário: "Estou criando um dashboard. Lembrando que prefiro gráficos do tipo 
Recharts e sempre uso dark mode com tons de azul."

Assistente (internamente):
1. Detecta preferências → Armazena
   - "Prefere Recharts para gráficos" (preference, importance:2)
   - "Sempre usa dark mode com tons de azul" (preference, importance:2)

2. Responde considerando o contexto

Assistente: "Entendido! Vou criar o dashboard usando Recharts com dark mode 
e paleta azul. Armazenei suas preferências para futuras telas."
```

---

## 🎨 Uso Otimizado por Cenário

### Cenário 1: Desenvolvedor Criando UI

**Objetivo:** Criar interfaces consistentes com suas preferências.

**Setup Inicial (uma vez):**
```javascript
// Armazenar preferências de design
memory_store_candidate({
  user_id: "patrick",
  text: "Minhas preferências de design: dark mode sempre, cores vibrantes mas 
  sutis, tipografia: Inter ou Poppins, espaçamentos generosos (Tailwind: p-6, gap-4), 
  borders arredondados (rounded-lg), glassmorphism quando apropriado",
  source: "design_preferences"
})

memory_store_candidate({
  user_id: "patrick",
  text: "Stack preferida: Next.js 14, TypeScript, TailwindCSS, shadcn/ui, 
  Framer Motion para animações",
  source: "tech_preferences"
})
```

**Ao criar cada tela:**
```javascript
generate_screen_prompt({
  user_id: "patrick",
  screen_description: "Dashboard com métricas de vendas",
  include_user_memories: true  // Vai usar preferências armazenadas
})

// O prompt gerado JÁ incluirá:
// - Dark mode
// - Cores vibrantes mas sutis
// - Tipografia Inter
// - Glassmorphism
// - Next.js + TypeScript + TailwindCSS
```

---

### Cenário 2: Consultor Trabalhando com Múltiplos Clientes

**Objetivo:** Manter contexto separado por cliente.

**Uso:**
```javascript
// Cliente A
memory_store_candidate({
  user_id: "cliente_a",
  text: "Cliente prefere design corporativo formal, cores: azul escuro e cinza",
  source: "client_brief"
})

// Cliente B
memory_store_candidate({
  user_id: "cliente_b",
  text: "Cliente startup, design jovem e colorido, cores: roxo e verde neon",
  source: "client_brief"
})

// Ao trabalhar
generate_screen_prompt({
  user_id: "cliente_a",  // Contexto do Cliente A
  screen_description: "Landing page institucional"
})
// Vai gerar: formal, azul escuro, corporativo

generate_screen_prompt({
  user_id: "cliente_b",  // Contexto do Cliente B
  screen_description: "Landing page institucional"
})
// Vai gerar: jovem, colorido, roxo e verde neon
```

---

### Cenário 3: Gestão de Tarefas e TODOs

**Objetivo:** Não esquecer tarefas importantes.

**Armazenamento:**
```javascript
memory_store_candidate({
  user_id: "patrick",
  text: "Preciso revisar o código de autenticação antes do deploy de sexta-feira",
  source: "todo"
})
// Será classificado como: type="task", ttl_days=7-14
```

**Consulta periódica:**
```javascript
memory_search({
  user_id: "patrick",
  query: "tarefas pendentes urgentes",
  filters: { 
    type_any: ["task"], 
    time_range_days: 14,
    min_importance: 2
  }
})
```

---

## ⚡ Regras de Ouro para Máximo Aproveitamento

### 1. **Armazene Proativamente**
❌ Não: Esperar o usuário pedir para armazenar  
✅ Sim: Detectar e armazenar automaticamente informações valiosas

### 2. **Use o Pipeline Completo para Buscas**
❌ Não: `search_vectors` básico para tudo  
✅ Sim: `memory_rewrite_query → memory_search → memory_rerank → memory_pack`

### 3. **Aproveite o TTL**
- Preferências e decisões: TTL longo (365+ dias)
- Tarefas: TTL curto (30-90 dias)
- Fatos temporários: TTL médio (60-180 dias)

### 4. **User_id é Fundamental**
- Sempre use o user_id correto
- Separe contextos por usuário/projeto
- Considere usar: `projeto_nome_user` para namespacing

### 5. **Abuse do generate_screen_prompt**
- Use para TODA criação de tela
- Armazene preferências de UI como memórias
- O prompt gerado será sempre melhor que um ad-hoc

### 6. **Cite as Memórias**
Ao responder usando memórias, sempre cite:
```
"Com base em suas preferências [mem:abc123], vou criar com dark mode..."
```

### 7. **Fallback Gracioso**
- Todas as ferramentas têm fallback
- Se LLM falhar, continuam funcionando
- Nunca deixe o usuário sem resposta

---

## 🔄 Ciclo de Melhoria Contínua

```
1. Conversação → Detectar informação valiosa
2. Armazenar → memory_store_candidate (com classificação LLM)
3. Enriquecer → Quanto mais memórias, melhor o contexto
4. Consultar → Pipeline completo de busca
5. Usar → Aplicar contexto em respostas e geração de código
6. Iterar → Novas informações → Volta para #1
```

**Resultado:** Sistema que fica mais inteligente a cada interação.

---

## 📊 Métricas de Sucesso

Uma boa utilização do MCP deve ter:

- ✅ **Taxa de armazenamento**: 5-10 memórias por sessão de trabalho
- ✅ **Taxa de uso**: 70%+ das buscas usam pipeline completo
- ✅ **Citações**: 100% das respostas baseadas em memória citam a fonte
- ✅ **Consistência**: Interfaces geradas seguem preferências armazenadas
- ✅ **Contexto**: Decisões técnicas são lembradas entre sessões

---

## 🎯 Checklist de Uso Otimizado

Ao interagir com usuário:

- [ ] Detectei preferências? → `memory_store_candidate`
- [ ] Detectei decisões? → `memory_store_candidate`
- [ ] Detectei tarefas? → `memory_store_candidate`
- [ ] Usuário fez pergunta sobre passado? → Pipeline de memória
- [ ] Usuário quer criar tela? → `generate_screen_prompt` com memórias
- [ ] Respondi usando memória? → Citei a fonte (mem:id)
- [ ] Nova sessão? → Buscar contexto relevante primeiro

---

## 💡 Exemplo de Sessão Completa Otimizada

```
👤 Usuário: Quero criar um sistema de blog

🤖 Assistente (internamente):
1. Buscar contexto: memory_search("decisões anteriores sobre blog/CMS")
2. Se encontrou: usar contexto
3. Se não: perguntar preferências

🤖 Assistente: "Vou te ajudar! Algumas perguntas:
- Que stack prefere?
- Qual estilo de design?"

👤 Usuário: "Next.js com TypeScript. Design minimalista e rápido"

🤖 Assistente (internamente):
1. memory_store_candidate("Stack: Next.js + TypeScript")
2. memory_store_candidate("Design: minimalista e rápido")

🤖 Assistente: "Perfeito! Vou começar. Primeira tela?"

👤 Usuário: "Tela de listagem de posts"

🤖 Assistente (internamente):
1. generate_screen_prompt({
     user_id: "patrick",
     screen_description: "Listagem de posts de blog",
     tech_stack: "Next.js + TypeScript",
     style_preferences: "minimalista",
     include_user_memories: true
   })
2. Usa full_prompt para gerar código

🤖 Assistente: *gera código usando prompt otimizado*
"Criei a tela considerando seu stack Next.js e design minimalista 
[com base em mem:xyz123]. O que acha?"

[Memórias armazenadas e contexto preservado para próximas telas]
```

---

## 🚀 Começando Agora

1. **Configure o user_id** no início da sessão
2. **Armazene 3-5 preferências iniciais** do usuário
3. **Use o pipeline completo** na primeira busca
4. **Gere o primeiro prompt de tela** com `generate_screen_prompt`
5. **Mantenha o ciclo** de armazenar → buscar → usar

**Resultado:** Sistema de memória inteligente que melhora continuamente!
