# PROJETO ALPHA - Auditoria e direcao do produto

Data de referencia: agosto de 2026.

## O que ja esta forte no GrafiCalc

- Calculadoras especificas para apostilas, impressos, credenciais, materiais por metro quadrado, resinados, cartoes, panfletos e blocos.
- Regras de faixa, acabamentos, descontos, sangria, aproveitamento e valores minimos configuraveis.
- Cadastro de clientes, historico de orcamentos, status comercial, OS, equipe e indicadores de desempenho.
- Configuracao compartilhada de produtos e precos, sem misturar os orcamentos em andamento de usuarios diferentes.
- Base de autenticacao e persistencia preparada para Supabase e publicacao pela Vercel.

## Melhorias entregues nesta etapa

1. A Home passa a orientar a primeira operacao da grafica: dados da empresa, primeiro cliente e primeiro orcamento.
2. Orcamentos pendentes, enviados e em negociacao entram em uma fila de acompanhamento, ordenada por prioridade e tempo parado.
3. A fila abre o historico diretamente, evitando que oportunidades comerciais se percam entre calculos.

## Riscos tecnicos a reduzir nas proximas fases

- O estado compartilhado ainda usa um payload amplo. Para crescimento comercial, clientes, orcamentos, OS e produtos devem migrar gradualmente para tabelas independentes no Supabase, com politicas RLS por empresa.
- O CSS legada possui iteracoes visuais acumuladas. A consolidacao deve ocorrer por tela, acompanhada de teste visual, sem uma limpeza destrutiva geral.
- Regras de calculo precisam ganhar testes automatizados por produto antes de grandes refatoracoes de interface.

## Proximas entregas de maior impacto comercial

1. Envio de orcamento profissional por WhatsApp e PDF, com registro de envio e lembrete de retorno.
2. Funil de atendimento: novo, enviado, em negociacao, aprovado, OS, concluido e perdido, com motivo de perda.
3. Quadro de producao para OS, responsavel, prazo, arte pendente e entrega.
4. Margem por item, custo de material e alerta de preco abaixo da margem minima.
5. Onboarding de teste de 5 dias com dados de exemplo opcionais, checklist e demonstracao de ganho de tempo.
6. Migracao progressiva do estado operacional para tabelas normalizadas no Supabase.

## Principio de seguranca da evolucao

Nenhuma tabela de preco, regra de calculo ou historico existente deve ser removido automaticamente. Mudancas de catalogo e precificacao continuam exigindo confirmacao do administrador da grafica.
