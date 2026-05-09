import Link from "next/link";

export default function Home() {
  return (
    <section className="hero-card">
      <p className="eyebrow">MVP operacional</p>
      <h1>Controle sua banca esportiva com disciplina e dados.</h1>
      <p>
        Acesse o painel de gestão para acompanhar lucro, ROI, drawdown, taxa de acerto,
        exposição em aberto e desempenho por estratégia.
      </p>
      <Link className="primary-link" href="/bankroll">
        Abrir Gestão de Banca
      </Link>
    </section>
  );
}
