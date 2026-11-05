# Supabase Sandbox do GrafiCalc

Projeto criado em 05/11/2026 no plano Free, região `sa-east-1` (São Paulo):

- Nome: GrafiCalc Sandbox
- Ref: `bhrzlswkfcijjmixjbuo`
- URL: `https://bhrzlswkfcijjmixjbuo.supabase.co`
- Configuração: Data API habilitada, exposição automática de novas tabelas desabilitada e RLS automático habilitado.
- Migrations `01`–`05` foram aplicadas no Sandbox e conferidas no catálogo: tabelas, RLS e grants esperados. Em 05/11/2026, o proprietário autorizou explicitamente `01`–`06` nesse Sandbox. Como `01`–`05` já constam aplicadas, não serão reaplicadas às cegas; a `06_graficalc_billing.sql` segue pendente até autenticar o MCP. A `07_graficalc_team_invitations.sql` não está autorizada para execução remota. A `08_atomic_auth_rate_limits.sql` foi autorizada separadamente para produção, mas ainda não foi executada porque a sessão Supabase conectada não tem acesso ao projeto de produção.
- Nenhuma migration foi aplicada à produção. Nenhum checkout/cobrança real foi criado.

O arquivo `.codex/config.toml` aponta o Codex para o MCP remoto oficial, restrito a esse projeto e aos grupos `database`/`docs`; operações de escrita pedem aprovação. O endpoint está configurado, mas a autenticação OAuth do MCP ainda não foi concluída. No Codex Desktop, abra **Settings → MCP servers** e escolha **Authenticate** para `supabase`; confirme que o consentimento se limita ao projeto GrafiCalc Sandbox. O acesso ao Dashboard no navegador, por si só, não autentica o MCP.

## Configuração local

Crie `.env.sandbox.local` na raiz do repositório com as chaves obtidas na página **Project Settings → API Keys** do projeto Sandbox. O arquivo já é ignorado pelo Git. Use apenas as chaves desse projeto:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://bhrzlswkfcijjmixjbuo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
GRAFICALC_TEST_SUPABASE_PROJECT_REF=bhrzlswkfcijjmixjbuo
```

Nunca use `.env.local` nesse teste: esse arquivo aponta para produção. O script valida a referência explícita, exige HTTPS e recusa o ref de produção conhecido.

## Limite de IP no login

O login é concluído por uma Route Handler do servidor. Por padrão, ela continua usando a chave publicável. Se o projeto habilitar **Authentication → Rate Limits → IP Address Forwarding**, pode-se configurar `SUPABASE_AUTH_IP_FORWARDING_ENABLED=true` no servidor: nesse modo a rota exige `SUPABASE_SECRET_KEY` e um `x-forwarded-for` válido do proxy, e envia o primeiro IP em `Sb-Forwarded-For` ao Supabase. Na Vercel, o cabeçalho `x-forwarded-for` é definido pela plataforma. Não habilite a variável antes de ligar o recurso no painel do projeto; valide o login primeiro no Sandbox.

## Teste de isolamento

As migrations `01`–`05` já estão aplicadas no Sandbox. O proprietário autorizou `01`–`06` para esse projeto, mas o MCP Supabase está sem autenticação (`Auth: Unknown`); a `06_graficalc_billing.sql` será executada depois de autenticar e confirmar novamente o projeto/ref. A `08_atomic_auth_rate_limits.sql` corrige a reserva concorrente de tentativas no login e no PIN; ainda precisa de autorização remota separada. A `07` é apenas para convites de equipe e permanece fora da autorização. Execute o teste de workspace depois de instalar as migrations necessárias ao código que estiver sendo homologado:

### Convites de funcionários

A migration `07_graficalc_team_invitations.sql` adiciona convites privados ao banco e atualiza os triggers de Auth. O líder envia apenas nome e e-mail; Supabase Auth manda o link, e a pessoa cria a própria senha. O trigger só associa o perfil ao tenant quando o token aleatório de uso único confere; o convite fica provisionado até a pessoa confirmar o e-mail, e só então passa a aceito. `user_metadata` não autoriza papel nem tenant.

No painel Supabase do Sandbox, conferir antes do teste:

- SMTP de Auth ativo e template **Invite user** configurado para o GrafiCalc.
- Em Authentication → URL Configuration → Redirect URLs, incluir `https://graficalc.com.br/auth/confirm` (e a URL de preview utilizada na homologação, se aplicável).
- A expiração de e-mail Auth é configurável; a migration mantém convite pendente por até uma hora para falhar fechado se o link expirar.

O teste PGlite valida trigger, token, vínculo e grants locais. Para validar entrega real, usar somente o Sandbox com uma caixa de e-mail de teste.

```powershell
npm run test:workspace-api
```

O teste cria dois usuários Auth temporários, dois tenants/workspaces, modifica dados e PINs de teste e tenta remover os registros no `finally`. Ele só deve rodar nesse projeto descartável. A migration `06` foi autorizada junto com `01`–`05` para o Sandbox, mas está pendente de autenticação OAuth no Codex; o checkout não tem `psql` nem Supabase CLI. `07` e `08` não estão autorizadas. Não execute essas migrations sem autorização separada e nunca use `.env.local`, que aponta para produção.
