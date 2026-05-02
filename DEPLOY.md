# 📦 Guia de Deploy – POPs Drogaria

## Stack
- **Frontend + Backend:** Next.js 14 (App Router) → Vercel
- **Banco de dados:** Supabase (PostgreSQL + Auth + RLS)
- **Pagamentos:** Mercado Pago
- **E-mail:** Resend

---

## 1. Configurar o Supabase

### 1.1 Criar projeto
1. Acesse https://supabase.com e crie uma conta
2. Clique em **New Project**
3. Dê um nome (ex: `pop-drogaria`) e escolha a região `South America (São Paulo)`

### 1.2 Criar o banco de dados
1. No painel do Supabase, vá em **SQL Editor**
2. Cole e execute o conteúdo de `supabase/migrations/001_initial.sql`
3. Isso cria as tabelas `pops` e `orders`, os índices e as políticas RLS

### 1.3 Criar o usuário admin
1. No Supabase, vá em **Authentication > Users**
2. Clique em **Add User**
3. Informe o e-mail e senha que você usará para acessar o painel admin
4. ⚠️ Guarde bem essas credenciais!

### 1.4 Copiar as chaves
No painel do Supabase vá em **Settings > API**:
- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha esta chave no frontend!)

---

## 2. Configurar o Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers/panel
2. Crie uma aplicação (tipo: **Checkout Pro**)
3. Vá em **Credenciais de Produção** (ou Teste para testar primeiro)
4. Copie o `Access Token` → `MP_ACCESS_TOKEN`

### Configurar Webhook no Mercado Pago
1. Em **Notificações IPN/Webhooks**, adicione a URL:
   `https://seu-projeto.vercel.app/api/webhooks/mercadopago`
2. Selecione o evento: **Pagamentos**

---

## 3. Configurar o Resend (e-mail)

1. Acesse https://resend.com e crie uma conta gratuita
2. Vá em **API Keys** e crie uma nova chave → `RESEND_API_KEY`
3. Em **Domains**, adicione e verifique seu domínio (ou use o domínio de teste do Resend)
4. No arquivo `src/lib/email.ts`, atualize o `FROM` com seu e-mail verificado

---

## 4. Deploy na Vercel

### 4.1 Instalar e autenticar
```bash
npm install -g vercel
vercel login
```

### 4.2 Fazer deploy
```bash
# Na pasta do projeto
cd pop-drogaria
npm install
vercel --prod
```

### 4.3 Configurar variáveis de ambiente
No painel da Vercel (vercel.com), vá em:
**Settings > Environment Variables** e adicione todas as variáveis do `.env.example`:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role |
| `MP_ACCESS_TOKEN` | Token do Mercado Pago |
| `RESEND_API_KEY` | Chave do Resend |
| `NEXT_PUBLIC_BASE_URL` | URL final do projeto (ex: https://seusite.vercel.app) |

Após adicionar as variáveis, faça um novo deploy:
```bash
vercel --prod
```

---

## 5. Primeiro acesso

### Painel Admin
1. Acesse `https://seusite.vercel.app/login`
2. Entre com o e-mail/senha criado no Supabase Authentication
3. Você verá o Dashboard com as métricas

### Adicionar mais POPs
1. No painel admin, vá em **POPs > Novo POP**
2. Preencha as informações, campos do formulário e template do documento
3. Use `{{fieldId}}` no template para inserir dados do formulário

---

## 6. Fluxo de teste

1. Acesse `/catalogo`
2. Selecione um POP, informe seu e-mail
3. Clique em **Pagar** → você será redirecionado ao Mercado Pago
4. Use cartão de teste: `5031 4332 1540 6351` / CVV: `123` / Vencimento: `11/25`
5. Após aprovação, verifique o e-mail recebido
6. Clique no link → preencha o formulário → baixe o PDF

---

## 7. Estrutura de arquivos

```
pop-drogaria/
├── src/
│   ├── app/
│   │   ├── catalogo/          → Loja: seleção de POPs
│   │   ├── checkout/          → Resumo + pagamento MP
│   │   │   ├── success/       → Pós-pagamento aprovado
│   │   │   └── failure/       → Pós-pagamento rejeitado
│   │   ├── download/          → Formulário + geração do PDF
│   │   ├── login/             → Login do admin
│   │   ├── admin/
│   │   │   ├── page.tsx       → Dashboard
│   │   │   ├── pops/          → CRUD de POPs
│   │   │   └── orders/        → Gestão de pedidos
│   │   └── api/
│   │       ├── payments/      → Cria preferência no MP
│   │       ├── webhooks/      → Recebe confirmação do MP
│   │       ├── download/      → Valida token + marca usado
│   │       └── admin/         → APIs protegidas do admin
│   ├── lib/
│   │   ├── supabase.ts        → Clientes Supabase
│   │   ├── pdf-generator.ts   → Gera o PDF no browser
│   │   └── email.ts           → Envia e-mail com Resend
│   └── types/index.ts         → TypeScript interfaces
├── supabase/
│   └── migrations/001_initial.sql
├── .env.example               → Template de variáveis
└── DEPLOY.md                  → Este guia
```

---

## 8. Como adicionar um novo POP (para os 42 restantes)

Você tem duas opções:

**Opção A: Via painel admin (recomendado)**
1. Entre no painel admin
2. Clique em **Novo POP**
3. Preencha título, número, preço, campos e template

**Opção B: Via SQL (em massa)**
Copie o bloco INSERT do arquivo `001_initial.sql` e adapte para cada novo POP. O campo `fields` define os campos do formulário e o campo `template` define o layout do documento.

### Template JSON – Referência rápida

```json
{
  "mainTitle": "Título Principal do Documento",
  "sections": [
    {
      "number": "1",
      "title": "Objetivos",
      "blocks": [
        { "type": "paragraph", "text": "Texto com {{variavel}} substituída." },
        { "type": "list", "items": ["Item 1", "Item {{variavel}}"] },
        { "type": "table", "rows": [
          ["Rótulo:", "{{variavel}}"]
        ]}
      ]
    }
  ]
}
```

---

## 9. Suporte e dúvidas

Em caso de dúvidas técnicas, consulte:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Mercado Pago Devs: https://www.mercadopago.com.br/developers
- Resend Docs: https://resend.com/docs
