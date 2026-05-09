export type BetMarket =
  | "Futebol"
  | "Tênis"
  | "Basquete"
  | "Escanteios"
  | "Over/Under"
  | "Handicap";

export type EntryMethod =
  | "Value bet pré-jogo"
  | "Live momentum"
  | "Modelo estatístico"
  | "Leitura de linhas"
  | "Arbitragem manual"
  | "Gestão de posição";

export type OperationStatus = "green" | "red" | "void" | "open";

export type RiskLevel = "conservador" | "moderado" | "agressivo";

export type PerformanceTrend = "lucrativo" | "prejuízo" | "neutro";

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
  method: EntryMethod;
  market: BetMarket;
  event: string;
  selection: string;
  odds: number;
  stake: number;
  profit: number;
  status: OperationStatus;
  notes?: string;
};

export type EquityPoint = {
  date: string;
  balance: number;
  profit: number;
};

export type PerformanceSummary = {
  operations: number;
  wins: number;
  losses: number;
  profit: number;
  stake: number;
  roi: number;
  hitRate: number;
  averageOdds: number;
  trend: PerformanceTrend;
};

export type StrategySummary = PerformanceSummary & {
  strategyId: string;
  strategyName: string;
};

export type MethodSummary = PerformanceSummary & {
  method: EntryMethod;
  averageStake: number;
  recommendation: string;
};

export type RiskAlert = {
  id: string;
  title: string;
  description: string;
  severity: "success" | "info" | "warning" | "critical";
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
  methods: MethodSummary[];
  alerts: RiskAlert[];
};
