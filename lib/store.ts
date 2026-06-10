"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData, DomainId, DomainState, Kpi, Project } from "./types";
import { SEED } from "./seed";

const STORAGE_KEY = "nexus-life-os:v1";

function loadInitial(): AppData {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge with seed so newly-added domains always exist.
    return { ...SEED, ...parsed } as AppData;
  } catch {
    return SEED;
  }
}

export interface Store {
  data: AppData;
  hydrated: boolean;
  update: (domain: DomainId, updater: (s: DomainState) => DomainState) => void;
  reset: () => void;
}

export function useStore(): Store {
  const [data, setData] = useState<AppData>(SEED);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota or privacy mode — ignore */
    }
  }, [data, hydrated]);

  const update = useCallback(
    (domain: DomainId, updater: (s: DomainState) => DomainState) => {
      setData((prev) => ({ ...prev, [domain]: updater(prev[domain]) }));
    },
    [],
  );

  const reset = useCallback(() => {
    setData(SEED);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { data, hydrated, update, reset };
}

/** Convenience: derive aggregate progress for a domain (avg of active projects). */
export function domainHealth(state: DomainState): number {
  const active = state.projects.filter((p) => p.status !== "done");
  if (active.length === 0) return 100;
  return Math.round(
    active.reduce((acc, p) => acc + p.progress, 0) / active.length,
  );
}

export interface ModuleSummary {
  health: number;
  activeProjects: number;
  totalProjects: number;
  kpiCount: number;
  /** Average progress of non-done projects. */
  momentum: number;
  topKpi?: { label: string; value: number; unit: string };
}

export function summarize(state: DomainState): ModuleSummary {
  const active = state.projects.filter((p) => p.status !== "done");
  const momentum = active.length
    ? Math.round(active.reduce((a, p) => a + p.progress, 0) / active.length)
    : 0;
  const top = state.kpis[0];
  return {
    health: domainHealth(state),
    activeProjects: state.projects.filter((p) => p.status === "active").length,
    totalProjects: state.projects.length,
    kpiCount: state.kpis.length,
    momentum,
    topKpi: top ? { label: top.label, value: top.value, unit: top.unit } : undefined,
  };
}

/** Builds a synthetic DomainState used to ground the global (home) copilot. */
export function globalState(data: AppData, labels: Record<string, string>): DomainState {
  const ids = Object.keys(data) as DomainId[];
  const kpis = ids.map((id) => {
    const h = domainHealth(data[id]);
    return {
      id: `g-${id}`,
      label: labels[id] ?? id,
      value: h,
      target: 100,
      unit: "%",
      trend: trendFromDelta(h - 70),
      delta: 0,
    };
  });
  const projects = ids.flatMap((id) =>
    data[id].projects
      .filter((p) => p.status === "active")
      .map((p) => ({ ...p, name: `[${labels[id] ?? id}] ${p.name}` })),
  );
  return { kpis, projects };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function emptyKpi(): Kpi {
  return {
    id: newId(),
    label: "Nouveau KPI",
    value: 0,
    target: 100,
    unit: "",
    trend: "flat",
    delta: 0,
  };
}

/** Trend is derived from the sign of the period-over-period delta. */
export function trendFromDelta(delta: number): Kpi["trend"] {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

export function emptyProject(): Project {
  return {
    id: newId(),
    name: "Nouveau projet",
    description: "",
    status: "planned",
    progress: 0,
    tags: [],
    tasks: [],
  };
}
