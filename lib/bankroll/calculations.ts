import type {
  BankrollOperation,
  BankrollSnapshot,
  BettingStrategy,
  EntryMethod,
  EquityPoint,
  MethodSummary,
  PerformanceSummary,
  PerformanceTrend,
  RiskAlert,
  RiskPlan,
  StrategySummary,
} from "./types";

const settledStatuses = new Set(["green", "red", "void"]);

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

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
  const averageOdds = operationsCount === 0
    ? 0
    : operations.reduce((sum, operation) => sum + operation.odds, 0) / operationsCount;
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
    averageOdds: roundCurrency(averageOdds),
    trend: classifyTrend(profit, roi),
  };
};

const buildMethodRecommendation = (summary: PerformanceSummary) => {
  if (summary.operations < 3) {
    return "Amostra pequena: colete mais entradas antes de aumentar stake.";
  }

  if (summary.trend === "lucrativo") {
    return "Método validado: manter execução e considerar aumento gradual dentro do plano.";
  }

  if (summary.trend === "prejuízo") {
    return "Método em prejuízo: reduzir stake, revisar critérios e pausar se repetir perdas.";
  }

  return "Método neutro: manter stake padrão e buscar filtros de seleção melhores.";
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

export function buildRiskAlerts(snapshot: Omit<BankrollSnapshot, "alerts">, plan: RiskPlan): RiskAlert[] {
  const exposureUsage = plan.maxDailyExposure === 0
    ? 0
    : (snapshot.openExposure / plan.maxDailyExposure) * 100;
  const currentProfitPercentage = plan.initialBankroll === 0
    ? 0
    : (snapshot.totalProfit / plan.initialBankroll) * 100;
  const losingMethods = snapshot.methods.filter((method) => method.trend === "prejuízo");
  const bestMethod = snapshot.methods.find((method) => method.trend === "lucrativo");
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
      description: "O drawdown máximo atingiu o limite do plano. Reduza volume e revise a carteira de métodos.",
      severity: "critical",
    });
  }

  if (currentProfitPercentage >= plan.takeProfitPercentage) {
    alerts.push({
      id: "take-profit",
      title: "Meta de lucro atingida",
      description: "A banca já superou o take profit definido. Proteja resultado e diminua exposição.",
      severity: "success",
    });
  }

  if (losingMethods.length > 0) {
    alerts.push({
      id: "losing-methods",
      title: "Métodos em prejuízo",
      description: `${losingMethods.map((method) => method.method).join(", ")} exigem revisão antes de novas entradas.`,
      severity: "warning",
    });
  }

  if (bestMethod) {
    alerts.push({
      id: "best-method",
      title: "Método mais eficiente",
      description: `${bestMethod.method} lidera a banca com ROI de ${bestMethod.roi.toFixed(1)}%.`,
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
  plan?: RiskPlan,
): BankrollSnapshot {
  const settledOperations = getSettledOperations(operations);
  const totalStake = settledOperations.reduce((sum, operation) => sum + operation.stake, 0);
  const totalProfit = settledOperations.reduce((sum, operation) => sum + operation.profit, 0);
  const wins = settledOperations.filter((operation) => operation.status === "green").length;
  const openExposure = operations
    .filter((operation) => operation.status === "open")
    .reduce((sum, operation) => sum + operation.stake, 0);
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
  };

  return {
    ...snapshotWithoutAlerts,
    alerts: plan ? buildRiskAlerts(snapshotWithoutAlerts, plan) : [],
  };
}
