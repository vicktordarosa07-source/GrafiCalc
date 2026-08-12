# GrafiCalc Local

Para abrir ou reiniciar o preview local com 1 clique, use:

- [iniciar-graficalc.bat](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/iniciar-graficalc.bat)
- [abrir-app.ps1](C:/Users/Júnior/Documents/Codex/2026-07-10/internal-web-app/abrir-app.ps1)

O iniciador faz este processo automaticamente:

- fecha a porta `3210` se houver uma instancia antiga presa
- carrega as variaveis locais do GrafiCalc
- sobe o arquivo `server.js`
- abre o navegador em [http://localhost:3210](http://localhost:3210)

O app permite:

- importar varios PDFs de uma vez
- preencher a quantidade de paginas automaticamente
- calcular varias apostilas diferentes na mesma tela
- alternar entre `Independente` e `Somar quantidades`
- editar tabelas de preco na aba `Configuracao`
- montar uma previa bonita de orcamento para o cliente

Observacoes:

- a leitura de paginas do PDF e automatica, mas se algum arquivo vier com contagem incorreta voce pode ajustar manualmente
- as configuracoes ficam salvas no navegador usado nesse computador

## Nova camada SaaS

O projeto agora possui uma camada Next.js + TypeScript com Supabase Auth. As calculadoras existentes continuam preservadas como módulo protegido durante a migração incremental.

- configuração completa: [docs/AUTENTICACAO-SUPABASE.md](docs/AUTENTICACAO-SUPABASE.md)
- migração de banco: `supabase/02_professional_auth.sql`
- desenvolvimento: `npm run dev`
- validação: `npm run check`
- produção: `npm run build`
