"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/bankroll/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function EquityChart({ data }: { data: EquityPoint[] }) {
  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Curva patrimonial</p>
          <h2>Evolução da banca</h2>
        </div>
        <span>{data.length} operações liquidadas</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bankrollGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b" }}
              tickFormatter={(value) => currencyFormatter.format(Number(value))}
            />
            <Tooltip
              formatter={(value) => currencyFormatter.format(Number(value))}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{ borderRadius: 16, border: "1px solid #bfdbfe" }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Banca"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#bankrollGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
