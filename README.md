# Gestão de Banca

MVP em Next.js para gestão de banca de trader esportivo na Betfair, focado em disciplina operacional,
controle de risco, leitura de preço e análise por método, mercado, campeonato e equipes.

## O que o MVP entrega

- Painel em `/bankroll` com KPIs de lucro total, ROI, taxa de acerto, drawdown máximo,
  stake média e exposição aberta.
- Curva patrimonial da banca com Recharts.
- Plano de risco com medidor visual, limites de stake, stop loss, take profit e alertas de exposição.
- Cadastro local de trades com estratégia, método, mercado Betfair, campeonato, equipes, seleção,
  lado Back/Lay, odd de entrada, odd de saída, stake, status e observações.
- Cálculo automático de lucro/prejuízo do trade a partir das odds de entrada e saída, respeitando
  a lógica de Back e Lay.
- Ranking de métodos para identificar o que está lucrativo, neutro ou em prejuízo, incluindo ROI,
  taxa de acerto, entrada média, saída média, movimento médio de preço e recomendação operacional.
- Ranking de estratégias, análise por mercado, últimas operações e regras de banca voltadas para
  trading esportivo com responsabilidade de exposição.
- Dados mockados tipados e cálculos de banca para lucro, ROI, drawdown, taxa de acerto, stake média,
  curva patrimonial, resumo por estratégia, resumo por método e alertas de risco.
- Tipos de domínio para operações, mercados Betfair, métodos de entrada, odds de entrada/saída,
  campeonatos, equipes, status, regras, estratégias e snapshot da banca.
- Item “Gestão de Banca” no menu lateral apontando para `/bankroll`.

## Módulos futuros sugeridos

- Importação de histórico da Betfair via CSV/planilha.
- Persistência em banco de dados e autenticação por usuário.
- Alertas automáticos para liability no Lay, spread alto, liquidez baixa, stop por sessão e método em prejuízo.
- Relatórios por competição, equipe, mercado, seleção, horário de entrada e período.
- Simulador de stake com responsabilidade máxima, greenbook/redbook e proteção por hedge parcial.

## Como executar

Instale as dependências e rode o servidor local na porta 9002:

```bash
npm install
npm run dev
```

Depois abra [http://localhost:9002/bankroll](http://localhost:9002/bankroll). Use o formulário “Registrar trade Betfair” para informar mercado, campeonato, equipes, odds de entrada e saída; a banca, os KPIs e o ranking de métodos serão recalculados na tela.
