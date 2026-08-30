# GrafiCalc + Resend

O GrafiCalc tem dois caminhos de email, mas a producao publicada em
`https://graficalc.com.br` usa **Supabase Auth** para cadastro, confirmacao de
email, reenvio e recuperacao de senha.

Isso significa que, para o site em producao, o Resend deve ser configurado no
**SMTP do Supabase**, nao apenas nas variaveis da Vercel.

## Fluxo ativo em producao

Arquivos envolvidos:

- `app/auth/actions.ts`
  - `signupAction` chama `supabase.auth.signUp`
  - `resendConfirmationAction` chama `supabase.auth.resend`
  - `requestPasswordResetAction` chama `supabase.auth.resetPasswordForEmail`
- `docs/AUTENTICACAO-SUPABASE.md`
  - define o Supabase Auth como fonte unica de confirmacao e recuperacao

Nesse fluxo, quem dispara o email e o Supabase. O app apenas chama a API de
autenticacao.

## Configuracao correta para producao

### 1. Verificar dominio no Resend

No painel do Resend:

1. Va em **Domains**.
2. Adicione `graficalc.com.br`.
3. Configure os registros DNS pedidos pelo Resend.
4. Aguarde o dominio aparecer como verificado.

Use um remetente do dominio verificado, por exemplo:

```text
GrafiCalc <no-reply@graficalc.com.br>
```

Nao use Gmail comum como remetente principal em producao.

### 2. Criar API key no Resend

No painel do Resend:

1. Va em **API Keys**.
2. Crie uma chave com permissao de envio.
3. Guarde a chave comecando por `re_`.

Essa chave nao deve ser commitada no repositorio.

### 3. Configurar SMTP no Supabase

No projeto Supabase `GrafiCalc` (`zneombmzsnslpqhggsph`):

1. Abra **Authentication**.
2. Abra **Emails** ou **Email Templates / SMTP Settings**.
3. Ative/configure **Custom SMTP**.
4. Preencha:

```text
Sender name: GrafiCalc
Sender email: no-reply@graficalc.com.br
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_xxxxxxxxx
Secure/TLS: enabled
```

Se a porta `465` falhar no painel, use `587` com TLS/STARTTLS.

### 4. Configurar URLs do Supabase Auth

Em **Authentication > URL Configuration**:

```text
Site URL: https://graficalc.com.br
Redirect URLs:
https://graficalc.com.br/**
https://grafi-calc.vercel.app/**
http://localhost:3210/**
```

Template recomendado para confirmacao:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

## Como verificar

1. Acesse `https://graficalc.com.br/cadastro`.
2. Crie um cadastro de teste com um email real.
3. Confirme que o email chega pela caixa de entrada.
4. No Resend, confira se o envio aparece em **Logs**.
5. No Supabase, confira **Authentication > Logs** se houver erro.

O endpoint abaixo confirma apenas se o app esta conectado ao Supabase; ele nao
prova que o SMTP esta configurado:

```text
https://graficalc.com.br/api/auth/health
```

## Variaveis locais do servidor legado

O arquivo `server.js` ainda suporta envio direto via API do Resend para o fluxo
legado local:

```powershell
$env:GRAFICALC_EMAIL_MODE = "resend"
$env:RESEND_API_KEY = "re_xxxxxxxxx"
$env:RESEND_FROM_EMAIL = "no-reply@graficalc.com.br"
```

Esse caminho nao resolve o envio de cadastro/recuperacao do site publicado se o
fluxo ativo estiver passando por Supabase Auth.

## Diagnostico rapido

- Se o cadastro retorna erro ou o email nao chega: verificar SMTP no Supabase.
- Se o Resend nao mostra log nenhum: o Supabase provavelmente nao esta usando o
  SMTP customizado.
- Se o Resend mostra erro de dominio/remetente: revisar verificacao DNS e
  `Sender email`.
- Se o email chega com link errado: revisar `Site URL`, `Redirect URLs` e
  templates do Supabase.

## Referencias oficiais

- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/docs/send-with-supabase-smtp
- https://resend.com/docs/send-with-smtp
