"use client";

import type { Kpi } from "@/lib/types";

function formatValue(v: number, unit: string): string {
  let s: string;
  if (Math.abs(v) >= 1000) s = v.toLocaleString("fr-FR");
  else if (Number.isInteger(v)) s = String(v);
  else s = v.toFixed(1).replace(".", ",");
  return unit === "€" ? `${s} €` : unit ? `${s} ${unit}` : s;
}

const trendIcon: Record<Kpi["trend"], string> = {
  up: "M3 17l6-6 4 4 7-7",
  down: "M3 7l6 6 4-4 7 7",
  flat: "M3 12h18",
};

export function KpiCard({ kpi, accent }: { kpi: Kpi; accent: string }) {
  const pct = kpi.target > 0 ? Math.min(100, Math.round((kpi.value / kpi.target) * 100)) : 0;
  const positive = kpi.delta > 0;
  const negative = kpi.delta < 0;

  return (
    <div className="glass glass-hover rounded-xl p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-muted">{kpi.label}</span>
        <span
          className="flex items-center gap-1 text-[11px] font-mono"
          style={{
            color: positive ? "#a3e635" : negative ? "#fb7185" : "#6b7385",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d={trendIcon[kpi.trend]} />
          </svg>
          {kpi.delta > 0 ? "+" : ""}
          {kpi.delta}
          {Number.isInteger(kpi.delta) ? "" : ""}%
        </span>
      </div>

      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">
        {formatValue(kpi.value, kpi.unit)}
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              boxShadow: `0 0 10px ${accent}88`,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-mono text-muted">
          <span>{pct}% de l&apos;objectif</span>
          <span>cible {formatValue(kpi.target, kpi.unit)}</span>
        </div>
      </div>
    </div>
  );
}
