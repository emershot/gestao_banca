import type { RiskAlert, RiskPlan } from "@/lib/bankroll/types";

const profileLabels = {
  conservador: "Conservador",
  moderado: "Moderado",
  agressivo: "Agressivo",
};

export function RiskMeter({
  plan,
  exposure,
  alerts = [],
}: {
  plan: RiskPlan;
  exposure: number;
  alerts?: RiskAlert[];
}) {
  const exposureUsage = Math.min(100, Math.round((exposure / plan.maxDailyExposure) * 100));
  const riskPosition = plan.profile === "conservador" ? 22 : plan.profile === "moderado" ? 52 : 82;

  return (
    <article className="risk-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plano de risco</p>
          <h2>{profileLabels[plan.profile]}</h2>
        </div>
        <span>{exposureUsage}% da exposição diária</span>
      </div>

      <div className="risk-meter" aria-label={`Risco ${profileLabels[plan.profile]}`}>
        <div className="risk-gradient" />
        <div className="risk-pin" style={{ left: `${riskPosition}%` }} />
      </div>

      <div className="risk-grid">
        <div>
          <small>Stake máx.</small>
          <strong>{plan.maxStakePercentage}%</strong>
        </div>
        <div>
          <small>Stop loss</small>
          <strong>{plan.stopLossPercentage}%</strong>
        </div>
        <div>
          <small>Take profit</small>
          <strong>{plan.takeProfitPercentage}%</strong>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="alert-list" aria-label="Alertas e recomendações de risco">
          {alerts.slice(0, 4).map((alert) => (
            <div className={`risk-alert ${alert.severity}`} key={alert.id}>
              <strong>{alert.title}</strong>
              <p>{alert.description}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
