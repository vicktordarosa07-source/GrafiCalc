# GrafiCalc + Supabase

Este projeto já foi preparado para trocar a base local `shared-state.local.json` por uma base real no Supabase.

## O que já está pronto

- O app continua falando com `/api/shared-state`
- O servidor local em [server.js](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/server.js) agora suporta dois modos:
  - `local-file`
  - `supabase`
- Quando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estiverem configurados, o backend passa a usar Supabase automaticamente
- O SQL inicial da base está em:
  - [supabase/01_graficalc_base.sql](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/supabase/01_graficalc_base.sql)

## Estrutura usada no Supabase

### Tabela `graficalc_tenants`
- guarda cada workspace
- chave prática atual: `slug`

### Tabela `graficalc_runtime_state`
- guarda o payload central do app por tenant
- campos principais:
  - `tenant_id`
  - `payload`
  - `updated_at`

## Variáveis de ambiente necessárias

Defina no computador/servidor que vai rodar o GrafiCalc:

```powershell
$env:SUPABASE_URL="https://SEU-PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
$env:GRAFICALC_TENANT_SLUG="graficalc-principal"
```

## Passos para ativar

1. Criar o projeto no Supabase
2. Rodar o SQL de:
   - [supabase/01_graficalc_base.sql](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/supabase/01_graficalc_base.sql)
3. Configurar as variáveis de ambiente
4. Reiniciar o servidor local do GrafiCalc
5. Validar em:
   - `http://127.0.0.1:3210/api/health`

## Como confirmar que virou Supabase

No retorno de `/api/health`, confira:

- `sharedBackendMode: "supabase"`
- `supabaseConfigured: true`

## Observação importante

Neste momento, o payload ainda é salvo como snapshot central em JSON.

Isso é proposital para:
- migrar rápido sem quebrar o app
- manter compatibilidade com a estrutura atual
- acelerar o lançamento

## Próxima evolução recomendada

Depois da primeira fase estável, o ideal é separar em tabelas próprias:

- usuários
- clientes
- histórico de orçamentos
- grupos/permissões
- configurações

Assim o GrafiCalc fica mais forte para:
- relatórios
- filtros avançados
- multiusuário real
- assinatura por tenant
## ConfiguraÃ§Ã£o local automÃ¡tica

Neste computador, o script [abrir-app.ps1](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/abrir-app.ps1) tambÃ©m consegue carregar automaticamente um arquivo local com as credenciais do Supabase:

- [graficalc.local-env.ps1](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/graficalc.local-env.ps1)

Esse arquivo fica fora do versionamento por seguranÃ§a e serve para abrir o app jÃ¡ conectado ao backend correto sem precisar configurar as variÃ¡veis manualmente toda vez.
