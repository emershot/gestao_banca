import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão de Banca",
  description: "MVP para acompanhamento de banca esportiva, risco e performance operacional.",
};

const menuItems = [
  { href: "/", label: "Visão Geral" },
  { href: "/bankroll", label: "Gestão de Banca" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Menu lateral">
            <div className="brand">
              <span className="brand-mark">GB</span>
              <div>
                <strong>Gestão Banca</strong>
                <small>Trading esportivo</small>
              </div>
            </div>
            <nav className="sidebar-nav">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
