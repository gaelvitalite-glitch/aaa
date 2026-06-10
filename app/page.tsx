"use client";

import { useMemo, useState } from "react";
import { DOMAINS, HOME_DOMAIN } from "@/lib/domains";
import type { DomainId } from "@/lib/types";
import { globalState, useStore } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Dashboard } from "@/components/Dashboard";
import { Assistant } from "@/components/Assistant";
import { Home as HomeView } from "@/components/Home";

type View = DomainId | "home";

const HOME_ICON = ["M3 11.5 12 4l9 7.5", "M5.5 10v9.5h13V10"];

export default function Page() {
  const { data, hydrated, update, reset } = useStore();
  const [active, setActive] = useState<View>("home");
  const [assistantOpen, setAssistantOpen] = useState(true);

  const isHome = active === "home";
  const domain = isHome ? HOME_DOMAIN : DOMAINS.find((d) => d.id === active)!;

  const labels = useMemo(
    () => Object.fromEntries(DOMAINS.map((d) => [d.id, d.label])),
    [],
  );
  // State fed to the copilot: global aggregate on home, the module's own state otherwise.
  const assistantState = isHome ? globalState(data, labels) : data[active as DomainId];

  return (
    <div className="grid-overlay flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-white/5 bg-bg-panel/40 px-4 py-6 backdrop-blur-xl lg:flex">
        <button onClick={() => setActive("home")} className="text-left" aria-label="Accueil">
          <Brand />
        </button>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem
            label="Accueil"
            icon={HOME_ICON}
            accent="#22d3ee"
            active={isHome}
            onClick={() => setActive("home")}
          />
          <div className="my-2 h-px bg-white/5" />
          {DOMAINS.map((d) => (
            <NavItem
              key={d.id}
              label={d.label}
              icon={d.icon}
              accent={d.accent}
              ai={d.ai}
              active={d.id === active}
              onClick={() => setActive(d.id)}
            />
          ))}
        </nav>

        <button
          onClick={() => {
            if (confirm("Réinitialiser toutes les données aux valeurs par défaut ?")) reset();
          }}
          className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:text-accent-rose"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Réinitialiser les données
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top nav */}
        <div className="sticky top-0 z-20 border-b border-white/5 bg-bg-base/80 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setActive("home")} aria-label="Accueil">
              <Brand compact />
            </button>
            <button
              onClick={() => setAssistantOpen((o) => !o)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs"
              style={{ borderColor: `${domain.accent}55`, color: domain.accent }}
            >
              {assistantOpen ? "Masquer l'IA" : "Copilote IA"}
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-3">
            <MobileChip label="Accueil" icon={HOME_ICON} accent="#22d3ee" active={isHome} onClick={() => setActive("home")} />
            {DOMAINS.map((d) => (
              <MobileChip
                key={d.id}
                label={d.label}
                icon={d.icon}
                accent={d.accent}
                active={d.id === active}
                onClick={() => setActive(d.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Content */}
          <main className="min-w-0 flex-1 overflow-y-auto px-5 py-7 sm:px-8 lg:py-9">
            <div className="mx-auto max-w-5xl">
              {!hydrated ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted">
                  Initialisation d&apos;UPPER LIFE…
                </div>
              ) : isHome ? (
                <HomeView domains={DOMAINS} data={data} onNavigate={(id) => setActive(id)} />
              ) : (
                <Dashboard
                  domain={domain}
                  state={data[active as DomainId]}
                  onChange={(updater) => update(active as DomainId, updater)}
                />
              )}
            </div>
          </main>

          {/* Assistant (desktop) */}
          <aside
            className={`hidden h-[calc(100vh)] w-[370px] shrink-0 border-l border-white/5 bg-bg-panel/40 backdrop-blur-xl ${
              assistantOpen ? "xl:block" : ""
            }`}
          >
            <div className="sticky top-0 h-screen">
              <Assistant domain={domain} state={assistantState} />
            </div>
          </aside>
        </div>

        {/* Assistant (mobile drawer) */}
        {assistantOpen && (
          <div className="fixed inset-x-0 bottom-0 z-30 h-[70vh] border-t border-white/10 bg-bg-panel/95 backdrop-blur-xl xl:hidden">
            <Assistant domain={domain} state={assistantState} />
          </div>
        )}
      </div>

      {/* Desktop assistant toggle (when hidden) */}
      {!assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-30 hidden h-12 w-12 items-center justify-center rounded-full shadow-glow xl:flex"
          style={{ background: domain.accent, color: "#04060b" }}
          aria-label="Ouvrir le copilote"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function NavItem({
  label,
  icon,
  accent,
  ai,
  active,
  onClick,
}: {
  label: string;
  icon: string[];
  accent: string;
  ai?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
        active ? "bg-white/[0.06] text-white" : "text-muted hover:bg-white/[0.03] hover:text-white/90"
      }`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        style={
          active
            ? { background: `${accent}24`, color: accent, border: `1px solid ${accent}55`, boxShadow: `0 0 14px ${accent}33` }
            : { color: "inherit", border: "1px solid transparent" }
        }
      >
        <Icon paths={icon} size={18} />
      </span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {ai && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted group-hover:text-white/60">
          AI
        </span>
      )}
      {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />}
    </button>
  );
}

function MobileChip({
  label,
  icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  icon: string[];
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${
        active ? "bg-white/10 text-white" : "text-muted"
      }`}
    >
      <span style={{ color: active ? accent : "inherit" }}>
        <Icon paths={icon} size={14} />
      </span>
      {label}
    </button>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={compact ? 30 : 34} />
      {!compact ? (
        <div>
          <div className="text-sm font-bold tracking-[0.22em] text-white">UPPER LIFE</div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted">Augmented OS</div>
        </div>
      ) : (
        <div className="text-sm font-bold tracking-[0.22em] text-white">UPPER LIFE</div>
      )}
    </div>
  );
}
