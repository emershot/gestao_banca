import type { BankrollOperation, BankrollSnapshot, BettingStrategy, EquityPoint, StrategySummary } from "./types";

const settledStatuses = new Set(["green", "red", "void"]);

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

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

export function calculateMaxDrawdown(equityCurve: EquityPoint[]) {
  let peak = equityCurve[0]?.balance ?? 0;
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
      const stake = strategyOperations.reduce((sum, operation) => sum + operation.stake, 0);
      const profit = strategyOperations.reduce((sum, operation) => sum + operation.profit, 0);
      const wins = strategyOperations.filter((operation) => operation.status === "green").length;
      const operationsCount = strategyOperations.length;

      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        operations: operationsCount,
        wins,
        profit: roundCurrency(profit),
        stake: roundCurrency(stake),
        roi: stake === 0 ? 0 : roundCurrency((profit / stake) * 100),
        hitRate: operationsCount === 0 ? 0 : roundCurrency((wins / operationsCount) * 100),
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export function calculateBankrollSnapshot(
  initialBankroll: number,
  operations: BankrollOperation[],
  strategies: BettingStrategy[],
): BankrollSnapshot {
  const settledOperations = getSettledOperations(operations);
  const totalStake = settledOperations.reduce((sum, operation) => sum + operation.stake, 0);
  const totalProfit = settledOperations.reduce((sum, operation) => sum + operation.profit, 0);
  const wins = settledOperations.filter((operation) => operation.status === "green").length;
  const openExposure = operations
    .filter((operation) => operation.status === "open")
    .reduce((sum, operation) => sum + operation.stake, 0);
  const equityCurve = calculateEquityCurve(initialBankroll, operations);

  return {
    initialBankroll,
    totalProfit: roundCurrency(totalProfit),
    currentBankroll: roundCurrency(initialBankroll + totalProfit),
    roi: totalStake === 0 ? 0 : roundCurrency((totalProfit / totalStake) * 100),
    hitRate: settledOperations.length === 0 ? 0 : roundCurrency((wins / settledOperations.length) * 100),
    maxDrawdown: calculateMaxDrawdown(equityCurve),
    averageStake: settledOperations.length === 0 ? 0 : roundCurrency(totalStake / settledOperations.length),
    openExposure: roundCurrency(openExposure),
    equityCurve,
    strategies: summarizeStrategies(operations, strategies),
  };
}
