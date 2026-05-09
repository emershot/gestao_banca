export type BetMarket =
  | "Futebol"
  | "Tênis"
  | "Basquete"
  | "Escanteios"
  | "Over/Under"
  | "Handicap";

export type OperationStatus = "green" | "red" | "void" | "open";

export type RiskLevel = "conservador" | "moderado" | "agressivo";

export type BankrollRule = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
};

export type BettingStrategy = {
  id: string;
  name: string;
  market: BetMarket;
  riskLevel: RiskLevel;
  targetRoi: number;
  maxStakePercentage: number;
};

export type BankrollOperation = {
  id: string;
  date: string;
  strategyId: string;
  market: BetMarket;
  event: string;
  selection: string;
  odds: number;
  stake: number;
  profit: number;
  status: OperationStatus;
};

export type EquityPoint = {
  date: string;
  balance: number;
  profit: number;
};

export type StrategySummary = {
  strategyId: string;
  strategyName: string;
  operations: number;
  wins: number;
  profit: number;
  stake: number;
  roi: number;
  hitRate: number;
};

export type RiskPlan = {
  profile: RiskLevel;
  initialBankroll: number;
  currentBankroll: number;
  maxDailyExposure: number;
  maxStakePercentage: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
};

export type BankrollSnapshot = {
  initialBankroll: number;
  totalProfit: number;
  currentBankroll: number;
  roi: number;
  hitRate: number;
  maxDrawdown: number;
  averageStake: number;
  openExposure: number;
  equityCurve: EquityPoint[];
  strategies: StrategySummary[];
};
