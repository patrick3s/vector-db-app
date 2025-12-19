# Screen Prompt Generator - Documentação

## 🎨 Nova Ferramenta: `generate_screen_prompt`

Ferramenta inteligente para gerar prompts otimizados para criação de telas/interfaces.

## Funcionalidades

1. **🧠 Integração com Memórias do Usuário**
   - Busca automática de preferências de UI/UX armazenadas
   - Considera gostos de cores, estilos, padrões de design

2. **🎯 Contextualização Técnica**
   - Suporte para diferentes stacks (React, Vue, Angular, etc.)
   - Personalização de bibliotecas e frameworks

3. **📋 Estruturação Detalhada**
   - Prompt dividido em seções claras
   - Guidelines de design específicos
   - Lista de componentes necessários
   - Requisitos de acessibilidade

4. **🔄 Fallback Inteligente**
   - Se o LLM falhar, retorna prompt básico funcional

## Parâmetros

```typescript
generate_screen_prompt(
  user_id: string,              // ID do usuário para buscar preferências
  screen_description: string,   // Descrição da tela desejada
  tech_stack?: string,          // Stack técnico (opcional)
  style_preferences?: string,   // Preferências de estilo (opcional)
  include_user_memories: bool   // Incluir memórias (padrão: true)
)
```

## Exemplos de Uso

### Exemplo 1: Tela de Login Simples

```json
{
  "user_id": "patrick",
  "screen_description": "Tela de login moderna com dark mode",
  "tech_stack": "React + TypeScript + TailwindCSS"
}
```

**Retorno esperado:**
```json
{
  "success": true,
  "prompt_title": "Tela de Login Moderna com Dark Mode",
  "main_prompt": "Crie uma tela de login moderna e elegante...",
  "tech_requirements": {
    "frameworks": ["React", "TypeScript"],
    "libraries": ["react-hook-form", "zod"],
    "styling": "TailwindCSS"
  },
  "design_guidelines": [
    "Usar esquema de cores dark mode com tons de cinza e acentos azuis",
    "Layout centralizado responsivo",
    "Animações suaves nas transições"
  ],
  "components_needed": [
    {"name": "LoginForm", "description": "Formulário principal com validação"},
    {"name": "Input", "description": "Campo de input reutilizável"},
    {"name": "Button", "description": "Botão primário de submit"}
  ],
  "full_prompt": "PROMPT COMPLETO PRONTO PARA USO..."
}
```

### Exemplo 2: Dashboard Complexo

```json
{
  "user_id": "patrick",
  "screen_description": "Dashboard analítico com gráficos e métricas em tempo real",
  "tech_stack": "Next.js 14 + TypeScript + shadcn/ui + Recharts",
  "style_preferences": "glassmorphism, gradientes sutis"
}
```

### Exemplo 3: Com Memórias do Usuário

```json
{
  "user_id": "patrick",
  "screen_description": "Tela de configurações do usuário",
  "include_user_memories": true
}
```

Se o usuário tiver armazenado preferências como:
- "Prefiro interfaces minimalistas"
- "Gosto de usar cores vibrantes mas sem exagero"
- "Dark mode sempre ativado"

O prompt gerado incorporará essas preferências automaticamente.

## Output Structure

O JSON retornado contém:

```json
{
  "success": true,
  "prompt_title": "Título descritivo",
  "main_prompt": "Descrição principal da tela",
  "tech_requirements": {
    "frameworks": [],
    "libraries": [],
    "styling": ""
  },
  "design_guidelines": [],
  "components_needed": [
    {"name": "...", "description": "..."}
  ],
  "layout_structure": "Descrição da hierarquia",
  "interactions": [],
  "accessibility": [],
  "full_prompt": "PROMPT COMPLETO OTIMIZADO",
  "user_preferences_used": true,
  "preferences_count": 3
}
```

## Fluxo de Trabalho Recomendado

1. **Armazene Preferências Primeiro** (opcional mas recomendado)
   ```json
   memory_store_candidate({
     "user_id": "patrick",
     "text": "Prefiro interfaces com glassmorphism e dark mode",
     "source": "preference_setting"
   })
   ```

2. **Gere o Prompt**
   ```json
   generate_screen_prompt({
     "user_id": "patrick",
     "screen_description": "tela de produtos com filtros e paginação"
   })
   ```

3. **Use o `full_prompt` Retornado**
   - Copie o campo `full_prompt` 
   - Cole em qualquer LLM (Claude, GPT-4, etc.)
   - Gere o código da interface

## Casos de Uso

- ✅ Criar telas do zero com contexto rico
- ✅ Gerar prompts consistentes baseados em preferências
- ✅ Documentar padrões de design do projeto
- ✅ Onboarding de novos desenvolvedores com guidelines
- ✅ Prototipar rapidamente com especificações detalhadas

## Vantagens

1. **Consistência**: Todos os prompts seguem o mesmo padrão estruturado
2. **Personalização**: Incorpora preferências do usuário
3. **Completude**: Inclui aspectos técnicos, design e acessibilidade
4. **Reutilização**: Prompts gerados podem virar templates
5. **Aprendizado**: O sistema aprende com as preferências armazenadas

## Limitações Atuais

- Token budget (`max_tokens_hint`) ainda não implementado
- Não gera o código diretamente (apenas o prompt otimizado)
- Depende da qualidade do modelo qwen3:4b-instruct

## Próximos Passos

Após gerar o prompt, você pode:
1. Usar o `full_prompt` em qualquer LLM
2. Iterar sobre o resultado armazenando feedback como memória
3. Refinar suas preferências para melhorar prompts futuros
