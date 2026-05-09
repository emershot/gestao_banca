# Gestão de Banca

MVP em Next.js para gestão de banca esportiva, focado em disciplina operacional,
controle de risco e leitura rápida de performance por estratégia.

## O que o MVP entrega

- Painel em `/bankroll` com KPIs de lucro total, ROI, taxa de acerto, drawdown máximo,
  stake média e exposição aberta.
- Curva patrimonial da banca com Recharts.
- Plano de risco com medidor visual, limites de stake, stop loss e take profit.
- Últimas operações, ranking de estratégias e regras de banca.
- Dados mockados tipados e cálculos de banca para lucro, ROI, drawdown, taxa de acerto,
  stake média, curva patrimonial e resumo por estratégia.
- Tipos de domínio para operações, mercados, status, regras, estratégias e snapshot da banca.
- Item “Gestão de Banca” no menu lateral apontando para `/bankroll`.

## Módulos futuros sugeridos

- Cadastro e importação de operações via CSV/planilha.
- Persistência em banco de dados e autenticação por usuário.
- Alertas automáticos para stop loss, exposição diária e quarentena de estratégias.
- Relatórios por casa de aposta, esporte, mercado e período.
- Simulador de stake dinâmica com Kelly fracionado e unidades fixas.

## Como executar

Instale as dependências e rode o servidor local na porta 9002:

```bash
npm install
npm run dev
```

Depois abra [http://localhost:9002/bankroll](http://localhost:9002/bankroll).
