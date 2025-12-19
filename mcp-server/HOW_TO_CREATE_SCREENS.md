# 🎯 Como Criar Telas - Guia Prático de Prompts

Este guia mostra exatamente o que VOCÊ deve dizer/escrever para criar telas usando o MCP.

---

## 📱 Versão Simples (Para Claude Desktop)

### Exemplo 1: Apenas Descrever o Que Quer

**Você simplesmente diz:**

> "Crie uma tela de cadastro de usuário"

**O que acontece automaticamente:**
1. ✅ Claude chama `generate_screen_prompt` internamente
2. ✅ Busca suas preferências de UI armazenadas
3. ✅ Gera prompt otimizado
4. ✅ Usa o prompt para criar o código
5. ✅ Te entrega a tela pronta

**Resultado:** Você recebe código completo da tela!

---

### Exemplo 2: Com Mais Detalhes

**Você diz:**

> "Crie uma tela de dashboard para exibir métricas de vendas. 
> Preciso ver: total de vendas, número de pedidos e gráfico de vendas por dia.
> Use Next.js e TailwindCSS."

**Claude automaticamente:**
1. Detecta: é uma solicitação de tela
2. Chama `generate_screen_prompt` com:
   - screen_description: "dashboard métricas de vendas..."
   - tech_stack: "Next.js + TailwindCSS"
   - include_user_memories: true
3. Gera código considerando suas preferências

---

### Exemplo 3: Especificando Estilo

**Você diz:**

> "Quero uma landing page para um app de fitness.
> Estilo moderno, cores vibrantes, com glassmorphism.
> Stack: React + TypeScript + Framer Motion"

**Claude usa:**
- screen_description: "landing page app de fitness"
- tech_stack: "React + TypeScript + Framer Motion"
- style_preferences: "moderno, cores vibrantes, glassmorphism"

---

## 🔧 Versão Avançada (Chamada Direta MCP)

Se você quiser controle total, pode chamar a ferramenta diretamente:

### Formato da Chamada

```json
{
  "tool": "generate_screen_prompt",
  "arguments": {
    "user_id": "patrick",
    "screen_description": "descrição da tela",
    "tech_stack": "tecnologias (opcional)",
    "style_preferences": "estilo visual (opcional)",
    "include_user_memories": true
  }
}
```

### Exemplo Completo 1: Tela de Login

**Você (via MCP direto):**

```json
{
  "tool": "generate_screen_prompt",
  "arguments": {
    "user_id": "patrick",
    "screen_description": "Tela de login empresarial com autenticação por email e senha, opção de lembrar-me e recuperação de senha",
    "tech_stack": "React + TypeScript + TailwindCSS + React Hook Form",
    "style_preferences": "corporativo, clean, azul escuro",
    "include_user_memories": true
  }
}
```

**Retorno:**

```json
{
  "success": true,
  "prompt_title": "Tela de Login Empresarial Segura",
  "full_prompt": "# Tela de Login Empresarial\n\n## Contexto...",
  "tech_requirements": {
    "frameworks": ["React", "TypeScript"],
    "libraries": ["react-hook-form", "zod"],
    "styling": "TailwindCSS"
  },
  "design_guidelines": [
    "Esquema de cores corporativo: azul escuro (#1e3a8a) como primário",
    "Layout centralizado e clean",
    "... mais diretrizes"
  ],
  "user_preferences_used": true,
  "preferences_count": 3
}
```

**Depois você usa o `full_prompt` para gerar o código!**

---

### Exemplo Completo 2: Dashboard Complexo

**Você:**

```json
{
  "tool": "generate_screen_prompt",
  "arguments": {
    "user_id": "patrick",
    "screen_description": "Dashboard administrativo para SaaS com KPIs (MRR, Churn, Active Users), gráficos de linha mostrando crescimento mensal, tabela de últimas transações e lista de usuários ativos",
    "tech_stack": "Next.js 14 App Router + TypeScript + shadcn/ui + Recharts + TanStack Query",
    "style_preferences": "dark mode, glassmorphism, gradientes roxo e azul",
    "include_user_memories": true
  }
}
```

---

### Exemplo Completo 3: E-commerce

**Você:**

```json
{
  "tool": "generate_screen_prompt",
  "arguments": {
    "user_id": "patrick",
    "screen_description": "Página de listagem de produtos para e-commerce de moda. Cards com imagem do produto, nome, preço, badge de desconto. Filtros laterais por categoria, preço, tamanho e cor. Ordenação por relevância, preço, novidades",
    "tech_stack": "Next.js + TypeScript + TailwindCSS",
    "style_preferences": "minimalista, clean, muito espaço em branco",
    "include_user_memories": false
  }
}
```

---

## 💬 Exemplos de Conversas Reais

### Conversa 1: Usuário Iniciante

**Você:**
> "Preciso criar uma tela de perfil de usuário"

**Claude:**
> "Vou criar para você! Uma tela de perfil onde o usuário pode:
> - Ver suas informações (nome, email, foto)
> - Editar os dados
> - Alterar senha
> 
> Correto? Qual stack você está usando?"

**Você:**
> "Sim! Estou usando React com TailwindCSS"

**Claude:**
> *[Internamente chama generate_screen_prompt]*
> 
> "Perfeito! Criei a tela de perfil. Vou te mostrar o código..."
> 
> *[Mostra código completo da tela]*

---

### Conversa 2: Usuário Experiente

**Você:**
> "Dashboard SaaS analytics. Preciso de:
> - Métricas principais no topo (4 cards)
> - Gráfico de linha para revenue
> - Gráfico de barra para user growth
> - Tabela de recent signups
> 
> Stack: Next.js 14, TypeScript, shadcn, Recharts
> Design: dark mode com glassmorphism"

**Claude:**
> *[Chama generate_screen_prompt com todos os detalhes]*
> 
> "Gerando o dashboard... Vou incluir:
> - Layout responsivo
> - Real-time updates
> - Glassmorphism theme
> 
> Aqui está o código completo..."

---

### Conversa 3: Com Preferências Armazenadas

**Setup inicial - você diz UMA VEZ:**
> "Sempre que eu pedir para criar telas, use:
> - Dark mode
> - Cores: roxo (#8b5cf6) e azul (#3b82f6)
> - Tipografia: Inter
> - Espaçamentos generosos
> - Borders arredondados"

**Claude armazena automaticamente via `memory_store_candidate`**

**Depois, quando você diz:**
> "Crie uma tela de configurações"

**Claude:**
> *[Busca suas preferências armazenadas]*
> *[Usa no generate_screen_prompt]*
> 
> "Criando tela de configurações com dark mode, cores roxo/azul, 
> tipografia Inter... conforme suas preferências [mem:abc123]"
> 
> *[Código já vem com todas as suas preferências aplicadas!]*

---

## 📝 Templates de Prompts Prontos

### Template 1: CRUD Básico

```
"Crie uma tela de [GERENCIAMENTO DE X] onde posso:
- Listar todos os [items]
- Adicionar novo [item] (modal/drawer)
- Editar [item] existente
- Deletar [item] com confirmação
- Buscar/filtrar [items]

Stack: [sua stack]
Estilo: [suas preferências]"
```

**Exemplo real:**
> "Crie uma tela de gerenciamento de tarefas onde posso listar todas as tarefas, adicionar nova tarefa em um modal, editar tarefa existente, deletar com confirmação e filtrar por status. Stack: React + TypeScript + TailwindCSS. Estilo: minimalista."

---

### Template 2: Formulário Complexo

```
"Crie um formulário de [FINALIDADE] com os campos:
- [Campo 1]: [tipo]
- [Campo 2]: [tipo]
- [Campo 3]: [tipo]

Validações:
- [Campo X] obrigatório
- [Campo Y] mínimo N caracteres

Stack: [sua stack]
Incluir estados de loading, erro e sucesso"
```

**Exemplo real:**
> "Crie um formulário de checkout com os campos: nome completo (texto), email (validar formato), endereço (textarea), CPF (máscara), número do cartão (máscara com validação). Validações: todos obrigatórios, email válido, CPF válido. Stack: React + React Hook Form + Zod. Incluir loading, erro e sucesso."

---

### Template 3: Dashboard/Analytics

```
"Crie um dashboard para visualizar [DADOS] contendo:

Métricas principais (cards no topo):
- [Métrica 1]
- [Métrica 2]
- [Métrica 3]

Gráficos:
- [Tipo de gráfico]: mostrando [dados]
- [Tipo de gráfico]: mostrando [dados]

Tabela/Lista:
- [Dados a mostrar]

Stack: [sua stack]
Features: filtros de data, export CSV, responsive"
```

**Exemplo real:**
> "Crie um dashboard para visualizar vendas contendo:
> 
> Métricas: Receita total, Número de pedidos, Ticket médio, Taxa de conversão
> 
> Gráficos: Gráfico de linha mostrando receita diária, Gráfico de pizza mostrando vendas por categoria
> 
> Tabela: Últimos 10 pedidos com detalhes
> 
> Stack: Next.js + Recharts + shadcn/ui
> Features: filtros de data (7d/30d/90d), export CSV, totalmente responsivo"

---

### Template 4: Landing Page

```
"Crie uma landing page para [PRODUTO/SERVIÇO] com:

Seções:
- Hero: [descrição]
- Features: [3-5 features principais]
- Como funciona: [steps]
- Depoimentos: [social proof]
- Pricing: [planos]
- CTA: [call to action]

Stack: [sua stack]
Estilo: [moderno/minimalista/colorido/etc]
Animações: [sim/não e quais]"
```

**Exemplo real:**
> "Crie uma landing page para app de produtividade com:
> 
> Hero: título impactante, subtítulo, screenshot do app, botão CTA
> Features: Gerenciamento de tarefas, Pomodoro timer, Estatísticas
> Como funciona: 3 passos (Cadastre-se, Crie tarefas, Acompanhe progresso)
> Depoimentos: 3 cards com foto, nome e review
> Pricing: 3 planos (Free, Pro, Enterprise)
> 
> Stack: Next.js + TailwindCSS + Framer Motion
> Estilo: moderno, cores vibrantes, gradientes
> Animações: scroll animations, hover effects, parallax sutil"

---

## 🎯 Dicas para Melhores Resultados

### ✅ Faça (DO):

1. **Seja específico sobre funcionalidades**
   - ❌ "Crie uma tela de usuários"
   - ✅ "Crie uma tela para listar, adicionar e editar usuários com foto de perfil"

2. **Mencione o stack técnico**
   - ✅ "Usando React + TypeScript + TailwindCSS"

3. **Descreva o estilo visual**
   - ✅ "Dark mode, minimalista, com glassmorphism"

4. **Mencione estados importantes**
   - ✅ "Incluir loading, erro, empty state e sucesso"

5. **Primeiro armazene suas preferências**
   - ✅ "Meu padrão é sempre dark mode com cores azul e roxo"

### ❌ Evite (DON'T):

1. **Ser vago demais**
   - ❌ "Faça uma tela bonita"

2. **Esquecer o stack**
   - ❌ Não mencionar qual framework usar

3. **Misturar muitas coisas**
   - ❌ "Crie login, dashboard e perfil" (faça uma de cada vez)

---

## 🚀 Fluxo Ideal

1. **Primeira vez:**
   ```
   "Quando eu pedir telas, sempre use dark mode, TailwindCSS, 
   cores roxo/azul, tipografia Inter, design minimalista"
   ```
   *Claude armazena suas preferências*

2. **Depois, só pedir:**
   ```
   "Crie uma tela de login"
   ```
   *Claude já aplica todas as suas preferências automaticamente!*

3. **Iterar se necessário:**
   ```
   "Adicione opção de login com Google"
   "Mude a cor do botão para verde"
   "Adicione animação no hover"
   ```

---

## 💡 Exemplo Completo End-to-End

### Primeira Sessão (Setup)

**Você:**
> "Vou começar um projeto de e-commerce. Minhas preferências:
> - Stack: Next.js 14 + TypeScript + TailwindCSS + shadcn/ui
> - Design: moderno, clean, muito espaço em branco
> - Cores: usar tons de verde (#10b981) para CTAs
> - Sempre dark mode
> - Animações sutis com Framer Motion"

**Claude:**
> "Armazenei suas preferências! Sempre vou usar:
> - Next.js 14 + TypeScript + TailwindCSS + shadcn/ui
> - Design clean com espaços generosos
> - Verde para CTAs
> - Dark mode
> - Animações Framer Motion
> 
> Pronto para criar as telas do e-commerce!"

### Criando Telas

**Você:**
> "Primeira tela: listagem de produtos com filtros"

**Claude:**
> *[Já usa TODAS as suas preferências automático]*
> "Criando listagem de produtos com dark mode, CTAs verdes, 
> animações com Framer Motion... Aqui está o código:"
> *[Código completo]*

**Você:**
> "Agora a página de detalhes do produto"

**Claude:**
> *[Mantém consistência com suas preferências]*
> "Criando página de produto mantendo o mesmo design system..."
> *[Mais código]*

### Resultado

Todas as telas têm:
- ✅ Mesmo design system
- ✅ Mesmas cores, tipografia, espaçamentos
- ✅ Mesma stack técnica
- ✅ Consistência total

**Você não precisa repetir suas preferências!**

---

## 🎓 Resumo

### Para criar uma tela, você pode:

1. **Modo Simples (Recomendado):**
   - Apenas diga "Crie uma tela de X"
   - Claude faz tudo automaticamente

2. **Modo Detalhado:**
   - Descreva funcionalidades, stack e estilo
   - "Crie tela de X com Y usando Z, estilo W"

3. **Modo Com Preferências:**
   - Primeiro: armazene suas preferências
   - Depois: só peça "Crie tela de X"
   - Claude usa suas preferências sempre

### A ferramenta `generate_screen_prompt`:
- ✅ Gera prompts otimizados de 300-500 linhas
- ✅ Inclui código base completo
- ✅ Considera suas preferências armazenadas
- ✅ Retorna JSON estruturado com tudo

### Você recebe:
- 📋 Prompt completo pronto para usar
- 💻 Código base TypeScript
- 🎨 Design system detalhado
- ♿ Guidelines de acessibilidade
- 📱 Layout responsivo
- ✨ Animações e interações

**Comece simples e vá evoluindo conforme a necessidade!** 🚀
