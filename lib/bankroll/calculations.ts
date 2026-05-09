import type {
  BankrollOperation,
  BankrollSnapshot,
  BetMarket,
  BettingStrategy,
  EntryMethod,
  EquityPoint,
  MarketSummary,
  MethodSummary,
  PerformanceSummary,
  PerformanceTrend,
  RiskAlert,
  RiskPlan,
  StrategySummary,
  TradeSide,
} from "./types";

const settledStatuses = new Set(["green", "red", "void"]);

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const getTradeExposure = (operation: BankrollOperation) => (
  operation.side === "Lay" ? operation.stake * (operation.entryOdds - 1) : operation.stake
);

const getTickMove = (operation: BankrollOperation) => {
  if (!operation.exitOdds) {
    return 0;
  }

  const rawMove = operation.entryOdds - operation.exitOdds;
  return operation.side === "Back" ? rawMove : rawMove * -1;
};

export function calculateTradeProfit(
  side: TradeSide,
  stake: number,
  entryOdds: number,
  exitOdds?: number,
) {
  if (!exitOdds || entryOdds <= 1 || exitOdds <= 1 || stake <= 0) {
    return 0;
  }

  const ratio = entryOdds / exitOdds;
  const profit = side === "Back" ? stake * (ratio - 1) : stake * (1 - ratio);

  return roundCurrency(profit);
}

export function resolveTradeStatus(profit: number): BankrollOperation["status"] {
  if (profit > 0) {
    return "green";
  }

  if (profit < 0) {
    return "red";
  }

  return "void";
}

const classifyTrend = (profit: number, roi: number): PerformanceTrend => {
  if (profit > 0 && roi >= 2) {
    return "lucrativo";
  }

  if (profit < 0 || roi < -2) {
    return "prejuízo";
  }

  return "neutro";
};

const buildPerformanceSummary = (operations: BankrollOperation[]): PerformanceSummary => {
  const stake = operations.reduce((sum, operation) => sum + operation.stake, 0);
  const profit = operations.reduce((sum, operation) => sum + operation.profit, 0);
  const wins = operations.filter((operation) => operation.status === "green").length;
  const losses = operations.filter((operation) => operation.status === "red").length;
  const operationsCount = operations.length;
  const exitedOperations = operations.filter((operation) => operation.exitOdds);
  const averageEntryOdds = operationsCount === 0
    ? 0
    : operations.reduce((sum, operation) => sum + operation.entryOdds, 0) / operationsCount;
  const averageExitOdds = exitedOperations.length === 0
    ? 0
    : exitedOperations.reduce((sum, operation) => sum + Number(operation.exitOdds), 0) / exitedOperations.length;
  const averageTickMove = operationsCount === 0
    ? 0
    : operations.reduce((sum, operation) => sum + getTickMove(operation), 0) / operationsCount;
  const roi = stake === 0 ? 0 : (profit / stake) * 100;
  const hitRate = operationsCount === 0 ? 0 : (wins / operationsCount) * 100;

  return {
    operations: operationsCount,
    wins,
    losses,
    profit: roundCurrency(profit),
    stake: roundCurrency(stake),
    roi: roundCurrency(roi),
    hitRate: roundCurrency(hitRate),
    averageEntryOdds: roundCurrency(averageEntryOdds),
    averageExitOdds: roundCurrency(averageExitOdds),
    averageTickMove: roundCurrency(averageTickMove),
    trend: classifyTrend(profit, roi),
  };
};

const buildMethodRecommendation = (summary: PerformanceSummary) => {
  if (summary.operations < 3) {
    return "Amostra pequena: valide mais trades antes de escalar stake na Betfair.";
  }

  if (summary.trend === "lucrativo" && summary.averageTickMove > 0) {
    return "Método validado: mantém leitura de preço favorável. Escale só dentro do limite de exposição.";
  }

  if (summary.trend === "lucrativo") {
    return "Método lucrativo, mas revise a relação entrada/saída para confirmar se o lucro não depende de exceções.";
  }

  if (summary.trend === "prejuízo") {
    return "Método em prejuízo: reduza stake, revise timing de entrada/saída e evite operar contra liquidez.";
  }

  return "Método neutro: mantenha stake mínima e refine critérios de mercado, campeonato e equipes.";
};

export function getSettledOperations(operations: BankrollOperation[]) {
  return operations.filter((operation) => settledStatuses.has(operation.status));
}

export function calculateEquityCurve(
  initialBankroll: number,
  operations: BankrollOperation[],
): EquityPoint[] {
  let balance = initialBankroll;

  return getSettledOperations(operations)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((operation) => {
      balance += operation.profit;

      return {
        date: operation.date,
        balance: roundCurrency(balance),
        profit: roundCurrency(operation.profit),
      };
    });
}

export function calculateMaxDrawdown(equityCurve: EquityPoint[], initialBankroll = 0) {
  let peak = initialBankroll || equityCurve[0]?.balance || 0;
  let maxDrawdown = 0;

  equityCurve.forEach((point) => {
    peak = Math.max(peak, point.balance);
    const drawdown = peak === 0 ? 0 : ((peak - point.balance) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  return roundCurrency(maxDrawdown);
}

export function summarizeStrategies(
  operations: BankrollOperation[],
  strategies: BettingStrategy[],
): StrategySummary[] {
  const settledOperations = getSettledOperations(operations);

  return strategies
    .map((strategy) => {
      const strategyOperations = settledOperations.filter(
        (operation) => operation.strategyId === strategy.id,
      );

      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        ...buildPerformanceSummary(strategyOperations),
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export function summarizeMethods(
  operations: BankrollOperation[],
  methods: EntryMethod[],
): MethodSummary[] {
  const settledOperations = getSettledOperations(operations);

  return methods
    .map((method) => {
      const methodOperations = settledOperations.filter((operation) => operation.method === method);
      const summary = buildPerformanceSummary(methodOperations);

      return {
        method,
        ...summary,
        averageStake: summary.operations === 0 ? 0 : roundCurrency(summary.stake / summary.operations),
        recommendation: buildMethodRecommendation(summary),
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export function summarizeMarkets(
  operations: BankrollOperation[],
  markets: BetMarket[],
): MarketSummary[] {
  const settledOperations = getSettledOperations(operations);

  return markets
    .map((market) => ({
      market,
      ...buildPerformanceSummary(settledOperations.filter((operation) => operation.market === market)),
    }))
    .sort((a, b) => b.profit - a.profit);
}

export function buildRiskAlerts(snapshot: Omit<BankrollSnapshot, "alerts">, plan: RiskPlan): RiskAlert[] {
  const exposureUsage = plan.maxDailyExposure === 0
    ? 0
    : (snapshot.openExposure / plan.maxDailyExposure) * 100;
  const currentProfitPercentage = plan.initialBankroll === 0
    ? 0
    : (snapshot.totalProfit / plan.initialBankroll) * 100;
  const losingMethods = snapshot.methods.filter((method) => method.trend === "prejuízo");
  const bestMethod = snapshot.methods.find((method) => method.trend === "lucrativo");
  const bestMarket = snapshot.markets.find((market) => market.trend === "lucrativo");
  const alerts: RiskAlert[] = [];

  if (exposureUsage >= 80) {
    alerts.push({
      id: "daily-exposure",
      title: "Exposição diária elevada",
      description: "A exposição aberta está próxima do limite diário. Evite novas entradas até encerrar posições.",
      severity: "critical",
    });
  } else {
    alerts.push({
      id: "daily-exposure-ok",
      title: "Exposição sob controle",
      description: "A exposição aberta está dentro do limite definido no plano de risco.",
      severity: "success",
    });
  }

  if (snapshot.maxDrawdown >= plan.stopLossPercentage) {
    alerts.push({
      id: "drawdown-stop",
      title: "Drawdown acima do stop",
      description: "O drawdown máximo atingiu o limite do plano. Reduza volume e revise mercados/campeonatos.",
      severity: "critical",
    });
  }

  if (currentProfitPercentage >= plan.takeProfitPercentage) {
    alerts.push({
      id: "take-profit",
      title: "Meta de lucro atingida",
      description: "A banca já superou o take profit definido. Proteja resultado, faça hedge e diminua exposição.",
      severity: "success",
    });
  }

  if (losingMethods.length > 0) {
    alerts.push({
      id: "losing-methods",
      title: "Métodos em prejuízo",
      description: `${losingMethods.map((method) => method.method).join(", ")} exigem revisão de timing e liquidez antes de novas entradas.`,
      severity: "warning",
    });
  }

  if (bestMethod) {
    alerts.push({
      id: "best-method",
      title: "Método mais eficiente",
      description: `${bestMethod.method} lidera a banca com ROI de ${bestMethod.roi.toFixed(1)}% e movimento médio de ${bestMethod.averageTickMove.toFixed(2)} ponto(s).`,
      severity: "info",
    });
  }

  if (bestMarket) {
    alerts.push({
      id: "best-market",
      title: "Mercado prioritário",
      description: `${bestMarket.market} apresenta a melhor leitura de preço no histórico atual.`,
      severity: "info",
    });
  }

  return alerts;
}

export function calculateBankrollSnapshot(
  initialBankroll: number,
  operations: BankrollOperation[],
  strategies: BettingStrategy[],
  methods: EntryMethod[],
  markets: BetMarket[],
  plan?: RiskPlan,
): BankrollSnapshot {
  const settledOperations = getSettledOperations(operations);
  const totalStake = settledOperations.reduce((sum, operation) => sum + operation.stake, 0);
  const totalProfit = settledOperations.reduce((sum, operation) => sum + operation.profit, 0);
  const wins = settledOperations.filter((operation) => operation.status === "green").length;
  const openExposure = operations
    .filter((operation) => operation.status === "open")
    .reduce((sum, operation) => sum + getTradeExposure(operation), 0);
  const equityCurve = calculateEquityCurve(initialBankroll, operations);
  const snapshotWithoutAlerts: Omit<BankrollSnapshot, "alerts"> = {
    initialBankroll,
    totalProfit: roundCurrency(totalProfit),
    currentBankroll: roundCurrency(initialBankroll + totalProfit),
    roi: totalStake === 0 ? 0 : roundCurrency((totalProfit / totalStake) * 100),
    hitRate: settledOperations.length === 0 ? 0 : roundCurrency((wins / settledOperations.length) * 100),
    maxDrawdown: calculateMaxDrawdown(equityCurve, initialBankroll),
    averageStake: settledOperations.length === 0 ? 0 : roundCurrency(totalStake / settledOperations.length),
    openExposure: roundCurrency(openExposure),
    equityCurve,
    strategies: summarizeStrategies(operations, strategies),
    methods: summarizeMethods(operations, methods),
    markets: summarizeMarkets(operations, markets),
  };

  return {
    ...snapshotWithoutAlerts,
    alerts: plan ? buildRiskAlerts(snapshotWithoutAlerts, plan) : [],
  };
}
