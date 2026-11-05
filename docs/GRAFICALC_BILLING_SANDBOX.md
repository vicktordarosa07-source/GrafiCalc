# Preparação da cobrança em Sandbox

O GrafiCalc usa Asaas apenas pelo endpoint de Sandbox `https://api-sandbox.asaas.com/v3`. A implementação não contém URL de API de produção e rejeita `GRAFICALC_ASAAS_ENVIRONMENT=production`.

## Estado inicial seguro

As variáveis começam desligadas em `.env.example`:

- `GRAFICALC_BILLING_ENABLED=false`
- `GRAFICALC_BILLING_ENFORCEMENT=false`
- `GRAFICALC_ASAAS_ENVIRONMENT=sandbox`
- `GRAFICALC_ASAAS_API_KEY=`
- `GRAFICALC_ASAAS_WEBHOOK_TOKEN=`
- `GRAFICALC_BILLING_PLANS_JSON=[]`
- `CRON_SECRET=` — use um valor aleatório distinto com pelo menos 32 caracteres no Vercel para proteger o worker de recuperação da fila.

Não preencha credenciais no navegador nem as envie por chat. Em homologação, use secrets server-side no ambiente Vercel de preview e uma conta Asaas Sandbox independente.

## Regras que ainda precisam de aprovação

Os preços não têm valor padrão. O catálogo é definido por `GRAFICALC_BILLING_PLANS_JSON`, no servidor, por exemplo:

```json
[
  {"key":"mensal","name":"Plano mensal","description":"Acesso mensal ao GrafiCalc","amountCents":999,"cycle":"monthly","trialDays":0,"graceDays":0},
  {"key":"anual","name":"Plano anual","description":"Acesso anual ao GrafiCalc","amountCents":1999,"cycle":"annual","trialDays":0,"graceDays":0}
]
```

Os valores `999` e `1999` são apenas exemplos sintáticos (R$ 9,99 e R$ 19,99); substitua pelos preços aprovados antes de configurar o ambiente. `trialDays` e `graceDays` também exigem decisão comercial. Nenhum valor do MetriFlow/GrafiFlow foi reutilizado.

Um tenant só pode usar o período de teste uma vez. Após esse uso, o catálogo mostra os planos sem um novo trial e uma contratação pode começar imediatamente; a RPC do banco também recusa tentativas concorrentes de reabrir o trial. O marcador de uso permanece depois que o cliente contrata um plano pago.

## Aplicação da estrutura no Supabase de testes

O SQL está em `supabase/06_graficalc_billing.sql`. Este projeto mantém scripts SQL numerados e o CLI Supabase não está instalado neste computador. Revise e aplique o script pelo SQL Editor de um projeto Supabase de homologação separado; não aplique primeiro no projeto de produção. Tabelas financeiras têm RLS ligado e não concedem acesso a `anon` ou `authenticated`; somente o servidor com chave privilegiada opera nelas.

Antes de aplicar no Supabase, execute `npm run test:billing-postgres`. O comando usa uma instância PostgreSQL local e descartável em PGlite, reaplica a migration e verifica idempotência, recorrências antigas, pagamentos atrasados e grants/RLS definidos no SQL. É uma regressão local sem Docker, Supabase CLI ou credenciais. Ela não substitui a homologação no projeto Supabase: não prova configuração remota, Auth, Edge Functions nem concorrência entre conexões.

## Webhook Sandbox

Depois de configurar as secrets, crie no painel Sandbox do Asaas um webhook para:

`https://<deployment-de-preview>/api/billing/webhook`

O endpoint valida `GRAFICALC_ASAAS_WEBHOOK_TOKEN` (32–255 caracteres, sem sequências previsíveis), reduz os dados do evento aos campos de cobrança necessários, grava o evento na fila PostgreSQL e responde HTTP 200 antes de executar as regras de negócio com `next/server` `after()`. Se o processamento falhar ou a execução terminar, o evento fica retentável; o cron protegido `/api/billing/worker` recupera eventos pendentes, falhos ou com claim expirado. Configure `CRON_SECRET` como valor aleatório de pelo menos 32 caracteres, sem padrões repetitivos/sequenciais, server-only, no Vercel. O worker recusa a configuração se o segredo não passar a mesma validação de força e só processa após comparação Bearer em tempo constante. O `vercel.json` o agenda a cada minuto. O plano Hobby da Vercel permite crons no máximo uma vez ao dia e é restrito a uso não comercial; para comercializar o GrafiCalc com recuperação contínua da fila, use um plano que aceite cron de minuto e uso comercial. O webhook e o worker ainda não foram implantados nesta auditoria.

Configure o mesmo token independente em `GRAFICALC_ASAAS_WEBHOOK_TOKEN` e no campo `authToken` do Asaas. Selecione `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`; eventos de assinatura `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_INACTIVATED`, `SUBSCRIPTION_DELETED`; e eventos de cobrança `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_AUTHORIZED`, `PAYMENT_AWAITING_RISK_ANALYSIS`, `PAYMENT_APPROVED_BY_RISK_ANALYSIS`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_ANTICIPATED`, `PAYMENT_RESTORED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUND_IN_PROGRESS`, `PAYMENT_REFUND_DENIED`, `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_RECEIVED_IN_CASH_UNDONE`, `PAYMENT_CANCELED`, `PAYMENT_DELETED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE`, `PAYMENT_AWAITING_CHARGEBACK_REVERSAL`. O endpoint valida `asaas-access-token`, persiste IDs de evento únicos, compara o total recebido com o valor reservado e mantém um histórico dos IDs de recorrência por tenant. Eventos `SUBSCRIPTION_*` usam `dateCreated` para descartar atualizações antigas; o mapa histórico permite processar pagamentos atrasados sem alterar o entitlement de uma recorrência nova. `PAYMENT_RESTORED` significa cobrança restaurada e fica pendente; somente `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` confirmam pagamento. Estorno em andamento ou contestação bloqueia o entitlement até um evento de resolução confiável. Configure o webhook com entrega sequencial para preservar a ordem dos eventos.

Não habilite `GRAFICALC_BILLING_ENFORCEMENT=true` até a migração estar aplicada e os fluxos de pagamento, estorno, renovação e bloqueio passarem no Sandbox. Esse sinal bloqueia o workspace depois do prazo de acesso, sem apagar os dados. A rota de login e a página `/assinatura` continuam separadas para regularização.

## Limites conhecidos

- A interface e as rotas dependem da migração e das secrets para carregar dados reais.
- A assinatura mensal cria uma recorrência Asaas em cartão; anual usa checkout avulso com cartão ou Pix e não renova automaticamente. A regra de renovação anual deve ser definida antes de vender o plano anual.
- Cancelamento da recorrência mensal pelo titular agora está implementado localmente em `POST /api/billing/cancel`: a rota exige sessão confirmada, titularidade do tenant e mesma origem, e usa somente `DELETE` na API Sandbox. O marcador local só é atualizado depois do aceite do provedor; o webhook continua sincronizando o estado. A tela avisa que cobranças pendentes ou vencidas vinculadas podem ser removidas pelo Asaas. A chamada ainda não foi homologada remotamente.
- Acesso de teste já concedido permanece até a data original após cancelar a recorrência. Cancelamento, incluindo esse caso, foi verificado em testes locais; a resposta real do Asaas e a sincronização por webhook continuam pendentes no Sandbox.
- Troca de plano, estorno parcial e reconciliação manual ainda não têm tela operacional. Planos e política de cancelamento/reembolso precisam de aprovação antes da venda.
- Homologação real no Asaas Sandbox é necessária antes de ligar a cobrança em preview; produção permanece bloqueada no código.
