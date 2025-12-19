# 🎨 Exemplos de Prompts Gerados - generate_screen_prompt

Este arquivo contém exemplos reais e completos de prompts gerados pela ferramenta MCP `generate_screen_prompt`.

---

## Exemplo 1: Tela de Login Moderna

### Input
```json
{
  "user_id": "patrick",
  "screen_description": "Tela de login moderna com autenticação social",
  "tech_stack": "React + TypeScript + TailwindCSS",
  "style_preferences": "dark mode, minimalista",
  "include_user_memories": true
}
```

### Output - Prompt Completo Gerado

```markdown
# Tela de Login Moderna com Autenticação Social

## Contexto e Propósito

Crie uma tela de login moderna, elegante e segura para uma aplicação web. A tela deve oferecer autenticação tradicional (email/senha) e opções de login social (Google, GitHub). O design deve ser minimalista, focado em usabilidade e conversão, com foco especial em acessibilidade e feedback visual claro para o usuário.

A tela será o primeiro ponto de contato do usuário com a aplicação, portanto deve transmitir profissionalismo e confiança, enquanto mantém uma experiência fluida e intuitiva.

## Stack Técnico

**Frameworks e Bibliotecas:**
- React 18+ com TypeScript para type-safety
- TailwindCSS para estilização utility-first
- React Hook Form para gerenciamento de formulário
- Zod para validação de schema
- NextAuth.js ou Firebase Auth para autenticação social

**Estilização:**
- TailwindCSS com custom theme
- Variáveis CSS para dark mode
- Animações com Tailwind transition classes

## Design Guidelines

### Esquema de Cores (Dark Mode)
- Background principal: `bg-gray-950`
- Background card: `bg-gray-900` com `border-gray-800`
- Texto primário: `text-gray-100`
- Texto secundário: `text-gray-400`
- Cor de acento: `blue-500` para botões e links
- Estados de erro: `red-500`
- Estados de sucesso: `green-500`

### Tipografia
- Font family: `font-sans` (Inter ou similar)
- Título: `text-3xl font-bold`
- Labels: `text-sm font-medium`
- Inputs: `text-base`
- Links: `text-sm underline-offset-2`

### Espaçamentos
- Container padding: `p-6 md:p-8`
- Gap entre elementos: `gap-4` para formulário, `gap-6` para seções
- Card max-width: `max-w-md`
- Borders: `rounded-lg` para card, `rounded-md` para inputs

### Layout
- Layout centralizado vertical e horizontalmente
- Responsivo: mobile-first approach
- Card elevado com sombra sutil: `shadow-xl shadow-black/20`

## Estrutura de Componentes

### 1. LoginPage (componente principal)
```typescript
LoginPage
├── Container (flex center, min-h-screen)
│   └── LoginCard (card com padding e border)
│       ├── Header (logo + título + descrição)
│       ├── LoginForm
│       │   ├── EmailInput (com validação)
│       │   ├── PasswordInput (com toggle show/hide)
│       │   ├── RememberMe (checkbox)
│       │   ├── SubmitButton (loading state)
│       │   └── ForgotPasswordLink
│       ├── Divider ("ou continue com")
│       ├── SocialLoginButtons
│       │   ├── GoogleButton
│       │   └── GitHubButton
│       └── Footer (link para sign up)
```

### 2. Componentes Necessários

#### Input Component
```typescript
interface InputProps {
  label: string;
  type: 'email' | 'password' | 'text';
  error?: string;
  icon?: React.ReactNode;
}
```
- Estados: default, focus, error, disabled
- Animação de label flutuante
- Ícone à esquerda (email/lock)
- Mensagem de erro abaixo

#### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'social';
  loading?: boolean;
  icon?: React.ReactNode;
}
```
- Primary: azul com hover mais escuro
- Social: outline com ícone da plataforma
- Loading state: spinner + texto "Entrando..."
- Disabled state: opacity-50 + cursor-not-allowed

#### SocialButton Component
- Google: ícone colorido + "Continuar com Google"
- GitHub: ícone branco + "Continuar com GitHub"
- Hover: escalar levemente (scale-105)
- Focus: ring azul para acessibilidade

## Interações e Estados

### Validação em Tempo Real
- Email: validar formato ao blur
- Senha: validar mínimo 6 caracteres ao blur
- Mostrar erros abaixo dos campos com animação fade-in

### Feedback Visual
- Submit button: mostrar spinner durante loading
- Desabilitar todos os inputs durante carregamento
- Sucesso: redireionar ou mostrar toast
- Erro: mostrar mensagem de erro no topo do card

### Animações
- Card: fade-in + slide-up ao montar (0.3s)
- Inputs: suave focus ring expansion
- Buttons: hover escala (scale-105) e mudança de cor
- Erros: shake animation + fade-in

### Estados do Formulário
1. **Idle**: formulário vazio ou parcialmente preenchido
2. **Validating**: validação em tempo real
3. **Submitting**: loading spinner, inputs desabilitados
4. **Error**: mensagem de erro exibida
5. **Success**: redirecionamento ou confirmação

## Acessibilidade (WCAG 2.1 AA)

### Navegação por Teclado
- Tab order lógico: email → password → remember me → submit → forgot password → social buttons
- Enter no input de senha: submeter formulário
- Escape: limpar erros (se houver)

### Screen Readers
- Labels semânticos: `<label htmlFor="email">`
- ARIA labels em ícones: `aria-label="Email input"`
- ARIA live region para erros: `aria-live="polite"`
- Form submit feedback: `aria-busy="true"` durante loading

### Contraste e Visibilidade
- Contraste mínimo 4.5:1 para textos
- Focus indicators visíveis: `ring-2 ring-blue-500`
- Mensagens de erro em vermelho com ícone explicativo
- Ícone de visibilidade na senha (eye/eye-off)

### Outros
- Formulário funcionando sem JavaScript (progressive enhancement)
- Error messages descritivas e acionáveis
- Loading states claramente indicados

## Código Base (Estrutura)

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Implementar autenticação
      console.log(data)
    } catch (error) {
      // Tratar erro
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    // Implementar login social
    console.log(`Login with ${provider}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      {/* Card Principal */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl shadow-black/20 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-400 text-sm">
            Entre com sua conta para continuar
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                disabled={isLoading}
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {/* Ícone eye/eye-off */}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="w-4 h-4 text-blue-500 border-gray-700 rounded focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-sm text-gray-300">Lembrar-me</span>
            </label>
            <a href="#" className="text-sm text-blue-500 hover:text-blue-400 underline-offset-2">
              Esqueceu a senha?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                {/* Spinner */}
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">ou continue com</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-100 font-medium rounded-md transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* Google Icon */}
            Continuar com Google
          </button>
          <button
            onClick={() => handleSocialLogin('github')}
            className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-100 font-medium rounded-md transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* GitHub Icon */}
            Continuar com GitHub
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Não tem uma conta?{' '}
          <a href="#" className="text-blue-500 hover:text-blue-400 underline-offset-2">
            Criar conta
          </a>
        </p>
      </div>
    </div>
  )
}
```

## Melhorias Opcionais

- Animação de transição entre estados (Framer Motion)
- Toast notifications para feedback de sucesso/erro
- Rate limiting visual (contador de tentativas)
- Captcha após X tentativas falhas
- Passwordless login (magic link)
- Biometric authentication (quando disponível)
```

---

## Exemplo 2: Dashboard Analítico

### Input
```json
{
  "user_id": "patrick",
  "screen_description": "Dashboard com métricas de vendas e gráficos em tempo real",
  "tech_stack": "Next.js 14 + TypeScript + shadcn/ui + Recharts",
  "style_preferences": "glassmorphism, gradientes sutis",
  "include_user_memories": false
}
```

### Output - Prompt Completo Gerado

```markdown
# Dashboard de Vendas com Analytics em Tempo Real

## Contexto e Propósito

Crie um dashboard administrativo completo e profissional para visualização de métricas de vendas e análise de dados em tempo real. O dashboard deve mostrar KPIs principais (receita, pedidos, taxa de conversão), gráficos interativos de tendências, e tabelas de dados detalhados.

O design deve utilizar glassmorphism para criar uma interface moderna e elegante, com efeitos de vidro fosco e gradientes sutis. Todos os dados devem atualizar em tempo real ou com polling periódico.

## Stack Técnico

**Frameworks:**
- Next.js 14 com App Router
- TypeScript para type-safety
- shadcn/ui para componentes base (Card, Button, Table, etc.)
- Recharts para gráficos e visualizações
- TanStack Query para data fetching e cache

**Estilização:**
- TailwindCSS com plugins:
  - @tailwindcss/forms
  - tailwindcss-animate
- Glassmorphism: backdrop-blur + backgrounds semi-transparentes
- Gradientes sutis com CSS gradients

**Dados em Tempo Real:**
- Server-Sent Events (SSE) ou WebSocket
- TanStack Query com refetchInterval
- Optimistic updates

## Design Guidelines

### Glassmorphism Theme

**Backgrounds:**
- Base: gradient de dark purple para dark blue
  ```css
  background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)
  ```
- Cards: `bg-white/10 backdrop-blur-xl border border-white/20`
- Sidebar: `bg-black/20 backdrop-blur-md`

**Gradientes para Gráficos:**
- Receita: `from-green-400 to-emerald-600`
- Pedidos: `from-blue-400 to-indigo-600`
- Taxa conversão: `from-purple-400 to-pink-600`

**Sombras e Efeitos:**
- Cards: `shadow-2xl shadow-black/40`
- Hover: `hover:shadow-3xl hover:scale-[1.02]`
- Glow effect em números principais: `text-shadow: 0 0 20px rgba(color, 0.5)`

### Tipografia
- Font: `font-sans` (Inter)
- KPIs (números grandes): `text-4xl font-bold tracking-tight`
- Títulos de seção: `text-2xl font-semibold`
- Labels: `text-sm font-medium text-white/70`
- Dados tabela: `text-sm text-white/90`

### Cores
- Texto principal: `text-white`
- Texto secundário: `text-white/70`
- Acento positivo (crescimento): `text-green-400`
- Acento negativo (queda): `text-red-400`
- Borders: `border-white/20`

## Estrutura de Componentes

```
DashboardPage
├── DashboardLayout
│   ├── Sidebar (navegação fixa)
│   │   ├── Logo
│   │   ├── NavLinks
│   │   └── UserProfile
│   └── MainContent
│       ├── Header (título + filtros de data)
│       ├── MetricsGrid (4 KPI cards)
│       │   ├── RevenueCard
│       │   ├── OrdersCard
│       │   ├── ConversionCard
│       │   └── CustomersCard
│       ├── ChartsRow
│       │   ├── RevenueChart (área)
│       │   └── OrdersByCategory (barra)
│       ├── RecentOrders (tabela)
│       └── TopProducts (list)
```

### Componentes Principais

#### MetricCard
```tsx
interface MetricCardProps {
  title: string
  value: string | number
  change: number  // % de mudança
  trend: 'up' | 'down'
  icon: React.ReactNode
  color: string  // gradient color
}
```

Features:
- Glassmorphism background
- Ícone com gradient match
- Valor grande e proeminente
- Indicador de tendência (↑/↓ com %)
- Animação de counting quando valor muda

#### RevenueChart
```tsx
interface RevenueChartProps {
  data: Array<{date: string, revenue: number}>
  timeRange: '7d' | '30d' | '90d'
}
```

Features:
- Recharts AreaChart
- Gradient fill abaixo da linha
- Tooltip customizado com glassmorphism
- Grid lines sutis
- Animação de entrada (smooth)
- Responsivo

#### RecentOrdersTable
```tsx
interface Order {
  id: string
  customer: string
  product: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  date: string
}
```

Features:
- shadcn/ui Table component
- Rows com hover effect (glassmorphism)
- Status badges coloridos
- Sortable columns
- Paginação
- Skeleton loading states

## Layout e Responsividade

### Desktop (1280px+)
```
+----------+--------------------------------+
| Sidebar  |         Header                 |
|  (fixed) |  [Filters] [Date Range]        |
|  240px   +--------------------------------+
|          | KPI Grid (4 columns)           |
|          | [Revenue] [Orders] [Conv] ... |
|          +--------------------------------+
|          | Charts Row (2 columns)         |
|          | [Revenue Chart] [Orders Chart] |
|          +--------------------------------+
|          | Recent Orders Table            |
|          | [Table with pagination]        |
+----------+--------------------------------+
```

### Tablet (768px - 1279px)
- Sidebar: collapsible hamburger
- KPI Grid: 2 columns
- Charts: stack vertically

### Mobile (< 768px)
- Sidebar: overlay quando aberto
- KPI Grid: 1 column
- Charts: full width stacked
- Table: horizontal scroll ou cards

## Interações e Animações

### Tempo Real
- Polling a cada 30s para novos dados
- Animação de "pulse" quando dados atualizam
- Contadores animados (incremento suave)
- Toast notification em updates importantes

### Hover States
- Cards: scale ligeiramente (1.02) + sombra aumentada
- Gráficos: highlight do data point
- Tabela: row background mais claro

### Loading States
- Skeleton loaders com shimmer effect
- Spinner em refetch de dados
- Desabilitar filtros durante loading

### Transições
- Page transitions: fade + slide
- Card animations: stagger (cada um aparece 50ms depois)
- Chart animations: 500ms ease-out

## Acessibilidade

- Contraste WCAG AA em todo texto
- Tab navigation funcional
- ARIA labels em gráficos: `aria-label="Gráfico de receita dos últimos 30 dias"`
- Screen reader announce em updates: `aria-live="polite"`
- Teclado: Esc fecha filtros, Tab navega
- Focus indicators visíveis

## Dados de Exemplo (Mock)

```typescript
const mockMetrics = {
  revenue: {
    value: 'R$ 45.231,00',
    change: +12.5,
    trend: 'up' as const
  },
  orders: {
    value: 356,
    change: +8.2,
    trend: 'up' as const
  },
  conversion: {
    value: '3.24%',
    change: -2.1,
    trend: 'down' as const
  },
  customers: {
    value: 1240,
    change: +18.7,
    trend: 'up' as const
  }
}

const mockChartData = [
  { date: '01/12', revenue: 4200 },
  { date: '02/12', revenue: 3800 },
  { date: '03/12', revenue: 5100 },
  // ... mais dados
]
```

## Código Base (Estrutura)

```tsx
'use client'

import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 h-screen fixed bg-black/20 backdrop-blur-md border-r border-white/10">
          {/* Nav content */}
        </aside>

        {/* Main Content */}
        <main className="ml-60 flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Vendas</h1>
            <p className="text-white/70">Visão geral do desempenho</p>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Receita Total"
              value="R$ 45.231,00"
              change={12.5}
              trend="up"
              icon={/* Icon */}
            />
            {/* More cards... */}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Receita</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#fff" opacity={0.5} />
                  <YAxis stroke="#fff" opacity={0.5} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#34d399" 
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            {/* More charts... */}
          </div>

          {/* Recent Orders Table */}
          <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Pedidos Recentes</h3>
            {/* Table */}
          </Card>
        </main>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend === 'up' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-white/70 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </Card>
  )
}
```
```

---

## Exemplo 3: Página de Produto E-commerce

### Input
```json
{
  "user_id": "patrick",
  "screen_description": "Página de produto com galeria de imagens, descrição e botão de compra",
  "tech_stack": "Next.js + TailwindCSS",
  "style_preferences": "clean, moderno, foco em conversão"
}
```

### Output - Resumo do Prompt Gerado

```markdown
# Página de Produto E-commerce

## Objetivo
Criar página de produto otimizada para conversão com:
- Galeria de imagens com zoom
- Informações claras do produto
- Call-to-action proeminente
- Reviews de clientes
- Produtos relacionados

## Layout Principal
```
+------------------+  +----------------------+
|                  |  | Nome do Produto      |
|  Galeria         |  | Preço (destaque)     |
|  Imagens         |  | Rating ⭐⭐⭐⭐⭐      |
|  (carousel)      |  |                      |
|  [Thumbs]        |  | Seleção de Variantes |
|                  |  | [Tamanho] [Cor]      |
|                  |  |                      |
|                  |  | [Adicionar Carrinho] |
+------------------+  +----------------------+

+------------------------------------------+
| Descrição Detalhada (tabs)              |
| [Descrição] [Especificações] [Avaliações]|
+------------------------------------------+

+------------------------------------------+
| Produtos Relacionados (carousel)         |
| [Produto 1] [Produto 2] [Produto 3] ... |
+------------------------------------------+
```

## Componentes Principais

1. **ImageGallery**: Zoom on hover, thumbnails, lightbox
2. **ProductInfo**: Nome, preço, rating, descrição curta
3. **VariantSelector**: Botões para tamanho/cor
4. **AddToCartButton**: Grande, call-to-action, loading states
5. **TabsSection**: Descrição/specs/reviews
6. **RelatedProducts**: Carousel de sugestões

## Otimizações de Conversão

- Preço em destaque (2x maior que texto normal)
- Botão "Adicionar ao Carrinho" sempre visível (sticky no mobile)
- Urgência: "Apenas 3 em estoque"
- Social proof: "127 pessoas compraram hoje"
- Frete grátis destacado
- Garantia de devolução visível
- Reviews com fotos
```

---

## Como Esses Prompts Foram Gerados

Todos esses prompts são gerados automaticamente pela ferramenta `generate_screen_prompt` usando:

1. **LLM (qwen3:4b-instruct)** para estruturação inteligente
2. **Memórias do usuário** (preferências de UI/UX armazenadas)
3. **Contexto técnico** (stack, frameworks)
4. **Best practices** de design e acessibilidade

## Usando os Prompts

1. **Copie o campo `full_prompt`** do retorno JSON
2. **Cole em qualquer LLM** (Claude, GPT-4, etc.)
3. **Receba código completo** da interface

O prompt já inclui tudo necessário para o LLM gerar código production-ready!
