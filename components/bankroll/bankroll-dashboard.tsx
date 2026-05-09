"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { EquityChart } from "./equity-chart";
import { RiskMeter } from "./risk-meter";
import { calculateBankrollSnapshot } from "@/lib/bankroll/calculations";
import type {
  BankrollOperation,
  BankrollRule,
  BetMarket,
  BettingStrategy,
  EntryMethod,
  OperationStatus,
  RiskPlan,
} from "@/lib/bankroll/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const markets: BetMarket[] = ["Futebol", "Tênis", "Basquete", "Escanteios", "Over/Under", "Handicap"];
const statuses: OperationStatus[] = ["green", "red", "void", "open"];
const storageKey = "gestao-banca-operations";

const statusLabels: Record<OperationStatus, string> = {
  green: "Green",
  red: "Red",
  void: "Void",
  open: "Aberta",
};

const trendLabels = {
  lucrativo: "Lucrativo",
  prejuízo: "Prejuízo",
  neutro: "Neutro",
};

const formatPercent = (value: number) => percentFormatter.format(value / 100);

const createInitialForm = (strategy: BettingStrategy, method: EntryMethod) => ({
  date: new Date().toISOString().slice(0, 10),
  strategyId: strategy.id,
  method,
  market: strategy.market,
  event: "",
  selection: "",
  odds: "1.80",
  stake: "50",
  status: "open" as OperationStatus,
  notes: "",
});

type BankrollDashboardProps = {
  initialBankroll: number;
  initialOperations: BankrollOperation[];
  strategies: BettingStrategy[];
  entryMethods: EntryMethod[];
  riskPlan: RiskPlan;
  bankrollRules: BankrollRule[];
};

export function BankrollDashboard({
  initialBankroll,
  initialOperations,
  strategies,
  entryMethods,
  riskPlan,
  bankrollRules,
}: BankrollDashboardProps) {
  const [operations, setOperations] = useState(initialOperations);
  const [storageReady, setStorageReady] = useState(false);
  const [methodFilter, setMethodFilter] = useState<EntryMethod | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<OperationStatus | "todos">("todos");
  const [form, setForm] = useState(() => createInitialForm(strategies[0], entryMethods[0]));


  useEffect(() => {
    const storedOperations = window.localStorage.getItem(storageKey);

    if (storedOperations) {
      setOperations(JSON.parse(storedOperations) as BankrollOperation[]);
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (storageReady) {
      window.localStorage.setItem(storageKey, JSON.stringify(operations));
    }
  }, [operations, storageReady]);

  const snapshot = useMemo(
    () => calculateBankrollSnapshot(initialBankroll, operations, strategies, entryMethods, riskPlan),
    [entryMethods, initialBankroll, operations, riskPlan, strategies],
  );
  const plan = { ...riskPlan, currentBankroll: snapshot.currentBankroll };
  const filteredOperations = operations
    .filter((operation) => methodFilter === "todos" || operation.method === methodFilter)
    .filter((operation) => statusFilter === "todos" || operation.status === statusFilter)
    .slice()
    .reverse();
  const bestMethod = snapshot.methods.find((method) => method.trend === "lucrativo");
  const worstMethod = snapshot.methods.slice().reverse().find((method) => method.trend === "prejuízo");
  const kpis = [
    { label: "Lucro total", value: currencyFormatter.format(snapshot.totalProfit), tone: snapshot.totalProfit >= 0 ? "positive" : "danger" },
    { label: "ROI", value: formatPercent(snapshot.roi), tone: snapshot.roi >= 0 ? "positive" : "danger" },
    { label: "Taxa de acerto", value: formatPercent(snapshot.hitRate), tone: "neutral" },
    { label: "Drawdown máx.", value: formatPercent(snapshot.maxDrawdown), tone: "warning" },
    { label: "Stake média", value: currencyFormatter.format(snapshot.averageStake), tone: "neutral" },
    { label: "Exposição aberta", value: currencyFormatter.format(snapshot.openExposure), tone: "warning" },
  ];

  const updateStrategy = (strategyId: string) => {
    const strategy = strategies.find((item) => item.id === strategyId) ?? strategies[0];
    setForm((currentForm) => ({
      ...currentForm,
      strategyId,
      market: strategy.market,
    }));
  };

  const submitOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const stake = Number(form.stake);
    const odds = Number(form.odds);
    const profitByStatus: Record<OperationStatus, number> = {
      green: stake * (odds - 1),
      red: -stake,
      void: 0,
      open: 0,
    };
    const operation: BankrollOperation = {
      id: `op-${Date.now()}`,
      date: form.date,
      strategyId: form.strategyId,
      method: form.method,
      market: form.market,
      event: form.event.trim() || "Entrada sem evento informado",
      selection: form.selection.trim() || "Seleção não informada",
      odds,
      stake,
      profit: profitByStatus[form.status],
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    setOperations((currentOperations) => [...currentOperations, operation]);
    setForm(createInitialForm(strategies[0], form.method));
  };

  return (
    <div className="bankroll-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gestão de Banca</p>
          <h1>Dashboard operacional de banca e métodos de entrada</h1>
          <p>
            Registre entradas, acompanhe o risco em tempo real e descubra quais métodos estão
            lucrativos, neutros ou em prejuízo antes de aumentar exposição.
          </p>
        </div>
        <div className="bankroll-balance">
          <span>Banca atual</span>
          <strong>{currencyFormatter.format(snapshot.currentBankroll)}</strong>
          <small>Inicial: {currencyFormatter.format(snapshot.initialBankroll)}</small>
        </div>
      </header>

      <section className="kpi-grid" aria-label="KPIs de banca">
        {kpis.map((kpi) => (
          <article className={`kpi-card ${kpi.tone}`} key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
          </article>
        ))}
      </section>

      <section className="insight-grid" aria-label="Diagnóstico de métodos">
        <article className="insight-card positive">
          <span>Método lucrativo</span>
          <strong>{bestMethod?.method ?? "Aguardando amostra"}</strong>
          <p>{bestMethod ? `${currencyFormatter.format(bestMethod.profit)} de lucro · ROI ${formatPercent(bestMethod.roi)}` : "Cadastre mais entradas liquidadas para validar um método vencedor."}</p>
        </article>
        <article className="insight-card danger">
          <span>Método em prejuízo</span>
          <strong>{worstMethod?.method ?? "Sem alerta"}</strong>
          <p>{worstMethod ? `${currencyFormatter.format(worstMethod.profit)} · reduzir stake e revisar critérios.` : "Nenhum método liquidado está classificado como prejuízo no momento."}</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <EquityChart data={snapshot.equityCurve} />
        <RiskMeter plan={plan} exposure={snapshot.openExposure} alerts={snapshot.alerts} />
      </section>

      <section className="operation-grid">
        <article className="panel-card operation-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Nova entrada</p>
              <h2>Informar método da entrada</h2>
            </div>
          </div>
          <form className="operation-form" onSubmit={submitOperation}>
            <label>
              Data
              <input
                required
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
            <label>
              Estratégia
              <select value={form.strategyId} onChange={(event) => updateStrategy(event.target.value)}>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                ))}
              </select>
            </label>
            <label>
              Método da entrada
              <select
                value={form.method}
                onChange={(event) => setForm({ ...form, method: event.target.value as EntryMethod })}
              >
                {entryMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label>
              Mercado
              <select
                value={form.market}
                onChange={(event) => setForm({ ...form, market: event.target.value as BetMarket })}
              >
                {markets.map((market) => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </label>
            <label>
              Evento
              <input
                placeholder="Ex.: Flamengo x Palmeiras"
                value={form.event}
                onChange={(event) => setForm({ ...form, event: event.target.value })}
              />
            </label>
            <label>
              Seleção
              <input
                placeholder="Ex.: Over 9.5 cantos"
                value={form.selection}
                onChange={(event) => setForm({ ...form, selection: event.target.value })}
              />
            </label>
            <label>
              Odd
              <input
                required
                min="1.01"
                step="0.01"
                type="number"
                value={form.odds}
                onChange={(event) => setForm({ ...form, odds: event.target.value })}
              />
            </label>
            <label>
              Stake
              <input
                required
                min="1"
                step="1"
                type="number"
                value={form.stake}
                onChange={(event) => setForm({ ...form, stake: event.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as OperationStatus })}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label className="full-field">
              Observações
              <textarea
                placeholder="Contexto da entrada, gatilho usado, erro operacional ou critério de validação."
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </label>
            <button type="submit">Adicionar entrada e recalcular banca</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Métodos</p>
              <h2>Lucro ou prejuízo por método</h2>
            </div>
          </div>
          <div className="method-list">
            {snapshot.methods.map((method) => (
              <div className={`method-item ${method.trend}`} key={method.method}>
                <div>
                  <span>{trendLabels[method.trend]}</span>
                  <strong>{method.method}</strong>
                  <small>
                    {method.operations} ops · {formatPercent(method.hitRate)} acerto · ROI {formatPercent(method.roi)} · odd média {method.averageOdds.toFixed(2)}
                  </small>
                  <p>{method.recommendation}</p>
                </div>
                <b>{currencyFormatter.format(method.profit)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel-card">
          <div className="section-heading filters-heading">
            <div>
              <p className="eyebrow">Operações</p>
              <h2>Entradas registradas</h2>
            </div>
            <div className="filters">
              <select
                aria-label="Filtrar por método"
                value={methodFilter}
                onChange={(event) => setMethodFilter(event.target.value as EntryMethod | "todos")}
              >
                <option value="todos">Todos os métodos</option>
                {entryMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <select
                aria-label="Filtrar por status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as OperationStatus | "todos")}
              >
                <option value="todos">Todos os status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Evento</th>
                  <th>Método</th>
                  <th>Stake</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map((operation) => (
                  <tr key={operation.id}>
                    <td>{operation.date}</td>
                    <td>
                      <strong>{operation.event}</strong>
                      <small>{operation.selection} · {operation.market} @ {operation.odds.toFixed(2)}</small>
                    </td>
                    <td>{operation.method}</td>
                    <td>{currencyFormatter.format(operation.stake)}</td>
                    <td className={`status ${operation.status}`}>
                      {operation.status === "open"
                        ? "Aberta"
                        : currencyFormatter.format(operation.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Estratégias</p>
              <h2>Ranking por lucro</h2>
            </div>
          </div>
          <div className="strategy-list">
            {snapshot.strategies.map((strategy, index) => (
              <div className="strategy-item" key={strategy.strategyId}>
                <span className="rank">#{index + 1}</span>
                <div>
                  <strong>{strategy.strategyName}</strong>
                  <small>
                    {strategy.operations} ops · {formatPercent(strategy.hitRate)} acerto · ROI {formatPercent(strategy.roi)}
                  </small>
                </div>
                <b className={strategy.profit < 0 ? "negative-value" : undefined}>{currencyFormatter.format(strategy.profit)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rules-grid" aria-label="Regras de banca">
        {bankrollRules.map((rule) => (
          <article className={`rule-card ${rule.severity}`} key={rule.id}>
            <span>{rule.severity}</span>
            <h3>{rule.title}</h3>
            <p>{rule.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
