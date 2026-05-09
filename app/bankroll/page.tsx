import { EquityChart } from "@/components/bankroll/equity-chart";
import { RiskMeter } from "@/components/bankroll/risk-meter";
import { bankrollRules, initialBankroll, operations, riskPlan, strategies } from "@/lib/bankroll/mock-data";
import { calculateBankrollSnapshot } from "@/lib/bankroll/calculations";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatPercent = (value: number) => percentFormatter.format(value / 100);

export default function BankrollPage() {
  const snapshot = calculateBankrollSnapshot(initialBankroll, operations, strategies);
  const plan = { ...riskPlan, currentBankroll: snapshot.currentBankroll };
  const latestOperations = operations.slice(-6).reverse();
  const kpis = [
    { label: "Lucro total", value: currencyFormatter.format(snapshot.totalProfit), tone: "positive" },
    { label: "ROI", value: formatPercent(snapshot.roi), tone: "positive" },
    { label: "Taxa de acerto", value: formatPercent(snapshot.hitRate), tone: "neutral" },
    { label: "Drawdown máx.", value: formatPercent(snapshot.maxDrawdown), tone: "warning" },
    { label: "Stake média", value: currencyFormatter.format(snapshot.averageStake), tone: "neutral" },
    { label: "Exposição aberta", value: currencyFormatter.format(snapshot.openExposure), tone: "warning" },
  ];

  return (
    <div className="bankroll-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gestão de Banca</p>
          <h1>Dashboard de performance e controle de risco</h1>
          <p>
            Acompanhe a saúde da banca, valide estratégias e mantenha as regras de exposição
            antes de executar novas operações esportivas.
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

      <section className="dashboard-grid">
        <EquityChart data={snapshot.equityCurve} />
        <RiskMeter plan={plan} exposure={snapshot.openExposure} />
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Operações</p>
              <h2>Últimas entradas</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Evento</th>
                  <th>Mercado</th>
                  <th>Stake</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {latestOperations.map((operation) => (
                  <tr key={operation.id}>
                    <td>{operation.date}</td>
                    <td>
                      <strong>{operation.event}</strong>
                      <small>{operation.selection}</small>
                    </td>
                    <td>{operation.market}</td>
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
                <b>{currencyFormatter.format(strategy.profit)}</b>
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
