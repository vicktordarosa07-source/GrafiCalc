# GrafiCalc + Resend

Hoje o GrafiCalc ja suporta dois modos para o codigo de confirmacao por e-mail:

- `local-outbox`
- `resend`

## O que ja esta pronto no projeto

- endpoint de envio: [server.js](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/server.js)
- variaveis locais em: [graficalc.local-env.ps1](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/graficalc.local-env.ps1)
- diagnostico em:
  - `http://127.0.0.1:3210/api/health`

## Como ativar

Edite [graficalc.local-env.ps1](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/graficalc.local-env.ps1) e preencha:

```powershell
$env:GRAFICALC_EMAIL_MODE = "resend"
$env:RESEND_API_KEY = "re_xxxxxxxxx"
$env:RESEND_FROM_EMAIL = "no-reply@seudominio.com.br"
```

Depois:

1. feche o servidor local do GrafiCalc
2. abra novamente por [abrir-app.ps1](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/abrir-app.ps1)
3. confira em `http://127.0.0.1:3210/api/health`

## Como confirmar

No `api/health`, confira:

- `email.mode: "resend"`
- `email.resendConfigured: true`
- `email.resendFromEmail` preenchido

## Observacao importante sobre o remetente

O GrafiCalc pode usar qualquer e-mail do dominio verificado na Resend.

Exemplo:

- `no-reply@graficalc.com.br`
- `cadastro@graficalc.com.br`
- `suporte@graficalc.com.br`

Nao e recomendavel usar um Gmail comum como remetente principal no modo profissional.

## Referencias oficiais

- [How do I create an email address or sender in Resend?](https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend)
- [Managing Domains](https://resend.com/docs/dashboard/domains/introduction)
