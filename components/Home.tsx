"use client";

import type { AppData, DomainId, DomainMeta } from "@/lib/types";
import { summarize } from "@/lib/store";
import { Icon } from "./Icon";

function energyColor(v: number): string {
  if (v >= 70) return "#a3e635";
  if (v >= 45) return "#fbbf24";
  return "#fb7185";
}

interface Props {
  domains: DomainMeta[];
  data: AppData;
  onNavigate: (id: DomainId) => void;
}

export function Home({ domains, data, onNavigate }: Props) {
  const summaries = domains.map((d) => ({ d, s: summarize(data[d.id]) }));

  const globalHealth = Math.round(
    summaries.reduce((a, x) => a + x.s.health, 0) / summaries.length,
  );
  const totalActive = summaries.reduce((a, x) => a + x.s.activeProjects, 0);
  const momentum = Math.round(
    summaries.reduce((a, x) => a + x.s.momentum, 0) / summaries.length,
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting = hour < 6 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bel après-midi" : "Bonsoir";

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
        {dateStr} · Vue d&apos;ensemble
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white text-balance">
        {greeting} — voici l&apos;état de ta vie augmentée.
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {domains.length} modules · {totalActive} projets actifs · momentum global {momentum}%
      </p>

      {/* Hero neon stats */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HeroStat
          label="Énergie globale"
          value={`${globalHealth}%`}
          sub="moyenne de santé des modules"
          accent={energyColor(globalHealth)}
        />
        <HeroStat
          label="Projets actifs"
          value={String(totalActive)}
          sub="en cours sur l'ensemble"
          accent="#22d3ee"
        />
        <HeroStat
          label="Momentum"
          value={`${momentum}%`}
          sub="progression moyenne"
          accent="#a78bfa"
        />
      </div>

      {/* Segments */}
      <h2 className="mt-9 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        Tes modules
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaries.map(({ d, s }) => (
          <SegmentCard key={d.id} d={d} s={s} onClick={() => onNavigate(d.id)} />
        ))}
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="glass relative overflow-hidden rounded-2xl p-5"
      style={{ borderColor: `${accent}33` }}
    >
      <span
        className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${accent}33` }}
      />
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div
        className="mt-2 font-mono text-4xl font-bold tracking-tight"
        style={{ color: accent, textShadow: `0 0 26px ${accent}66` }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted">{sub}</div>
    </div>
  );
}

function SegmentCard({
  d,
  s,
  onClick,
}: {
  d: DomainMeta;
  s: ReturnType<typeof summarize>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group glass glass-hover relative overflow-hidden rounded-xl p-4 text-left"
    >
      {/* Accent edge */}
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: d.accent, boxShadow: `0 0 16px ${d.accent}` }}
      />
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-90"
        style={{ background: `${d.accent}22` }}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `${d.accent}1a`, border: `1px solid ${d.accent}44`, color: d.accent }}
          >
            <Icon paths={d.icon} size={18} />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-white">{d.label}</span>
              {d.ai && (
                <span
                  className="rounded-full border px-1.5 text-[9px] font-semibold uppercase"
                  style={{ borderColor: `${d.accent}55`, color: d.accent }}
                >
                  AI
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted">{d.tagline}</div>
          </div>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={d.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="translate-x-0 opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-100"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </div>

      {/* Health bar */}
      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${s.health}%`,
              background: `linear-gradient(90deg, ${d.accent}, ${d.accent}aa)`,
              boxShadow: `0 0 10px ${d.accent}88`,
            }}
          />
        </div>
      </div>

      {/* Mini stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label="Santé" value={`${s.health}%`} accent={d.accent} glow />
        <Mini label="Actifs" value={String(s.activeProjects)} />
        <Mini label="KPIs" value={String(s.kpiCount)} />
      </div>
    </button>
  );
}

function Mini({
  label,
  value,
  accent,
  glow,
}: {
  label: string;
  value: string;
  accent?: string;
  glow?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] py-2">
      <div
        className="font-mono text-base font-semibold"
        style={
          accent
            ? { color: accent, textShadow: glow ? `0 0 14px ${accent}77` : undefined }
            : { color: "#fff" }
        }
      >
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
