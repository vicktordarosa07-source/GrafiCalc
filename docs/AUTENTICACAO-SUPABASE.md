# Autenticação profissional do GrafiCalc

## Arquitetura

- Next.js App Router protege as rotas e renova os cookies de sessão no `proxy.ts`.
- Supabase Auth é a única fonte de senhas, tokens, confirmação de e-mail e recuperação.
- `public.profiles` guarda somente dados cadastrais e o vínculo com a gráfica.
- O motor legado de cálculos permanece em `/legacy`, acessível apenas dentro de uma sessão confirmada.
- `/api/shared-state` identifica o `tenant_id` pela sessão; o navegador nunca recebe a chave administrativa.

## 1. Banco de dados

Execute no SQL Editor, nesta ordem:

1. `supabase/01_graficalc_base.sql` se a base ainda não existir.
2. `supabase/02_professional_auth.sql` para perfis, gatilhos, RLS e rate limit.

Depois da aplicação, consulte os avisos de segurança e desempenho do Supabase. Todas as tabelas expostas devem permanecer com RLS habilitado.

## 2. Variáveis de ambiente

Cadastre localmente em `.env.local` e na Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
NEXT_PUBLIC_SESSION_IDLE_MINUTES=30
```

Nunca exponha `SUPABASE_SECRET_KEY` no navegador, em commits ou em variáveis com prefixo `NEXT_PUBLIC_`.

## 3. URLs do Supabase Auth

Em **Autenticação > Configuração de URL**:

- URL do site: domínio oficial do GrafiCalc.
- URLs de redirecionamento: `http://localhost:3210/**` e `https://SEU-DOMINIO/**`.

No template de confirmação de cadastro, use:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

O template de recuperação deve apontar para a URL gerada pelo Supabase; o `redirectTo` do app termina em `/alterar-senha`.

## 4. E-mail transacional

Configure SMTP próprio em **Autenticação > E-mails > SMTP**. Para produção, use Resend com domínio verificado; o remetente gratuito de testes não deve ser usado no lançamento.

## 5. Cloudflare Turnstile

1. Crie um widget para o domínio oficial e para `localhost` durante testes.
2. Coloque a chave pública em `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. No Supabase, habilite a proteção CAPTCHA e cadastre a chave secreta do Turnstile.

Sem a chave pública, o componente fica oculto para permitir desenvolvimento local. Em produção, a publicação deve ser bloqueada se a variável estiver vazia.

## 6. Migração dos dados atuais

O cadastro de uma nova gráfica cria um tenant isolado. O snapshot antigo não é apagado. Para vincular o primeiro administrador à gráfica já existente, confirme primeiro a conta no Supabase e então atualize, pelo SQL Editor, o `tenant_id` do perfil para o tenant que contém o snapshot atual. Faça backup do registro de `graficalc_runtime_state` antes dessa operação.

## 7. Verificação

```powershell
npm run check
npm run build
npm run dev
```

Fluxos obrigatórios antes do lançamento:

1. Cadastro com CPF e CNPJ válidos e rejeição dos inválidos.
2. Recebimento e abertura da confirmação de e-mail.
3. Bloqueio antes da confirmação.
4. Login persistente após atualizar a página.
5. Recuperação e alteração de senha.
6. Bloqueio temporário após cinco falhas de login.
7. Logout manual e automático por inatividade.
8. Acesso negado a `/workspace`, `/perfil`, `/legacy` e APIs sem sessão.

## 8. Publicação na Vercel

Cadastre todas as variáveis da seção 2 nos ambientes **Production**, **Preview** e **Development** da Vercel. Use `https://grafi-calc.vercel.app` em `NEXT_PUBLIC_SITE_URL` enquanto esse for o domínio oficial.

O proxy do GrafiCalc falha fechado: se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` estiverem ausentes, apenas as telas públicas ficam acessíveis e qualquer área privada retorna para o login com `erro=configuracao`.

Antes de publicar, configure no Supabase Auth:

1. Site URL: `https://grafi-calc.vercel.app`.
2. Redirect URLs: `https://grafi-calc.vercel.app/**` e `http://localhost:3210/**`.
3. Confirmação de e-mail obrigatória.
4. SMTP Resend com domínio verificado.
5. CAPTCHA habilitado com a chave secreta do Cloudflare Turnstile.
