"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData, DomainId, DomainState, Project } from "./types";
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

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
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
