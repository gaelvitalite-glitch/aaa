"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, DomainMeta, DomainState } from "@/lib/types";

function buildSnapshot(state: DomainState): string {
  const kpis = state.kpis
    .map((k) => `- ${k.label}: ${k.value}${k.unit} (cible ${k.target}${k.unit}, ${k.delta > 0 ? "+" : ""}${k.delta}%)`)
    .join("\n");
  const projects = state.projects
    .map(
      (p) =>
        `- ${p.name} [${p.status}] ${p.progress}% — ${p.tasks.filter((t) => t.done).length}/${p.tasks.length} tâches`,
    )
    .join("\n");
  return `KPIs:\n${kpis}\n\nProjets:\n${projects}`;
}

export function Assistant({
  domain,
  state,
}: {
  domain: DomainMeta;
  state: DomainState;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Reset conversation when switching domains.
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [domain.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const suggestions = SUGGESTIONS[domain.id] ?? [];

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: domain.assistantContext,
          snapshot: buildSnapshot(state),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Erreur réseau." }));
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${err.error ?? "Erreur."}` };
          return copy;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "⚠️ Connexion interrompue." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span
          className="relative flex h-2 w-2 items-center justify-center"
          title="Assistant connecté"
        >
          <span className="absolute h-2 w-2 animate-pulse-ring rounded-full" style={{ background: domain.accent }} />
          <span className="h-2 w-2 rounded-full" style={{ background: domain.accent }} />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Copilote {domain.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted">
            propulsé par Claude · contextualisé
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[11px] text-muted hover:text-white"
          >
            effacer
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted text-balance">
              Pose une question sur ton module <span className="text-white">{domain.label}</span>.
              L&apos;assistant connaît tes KPIs et projets en cours.
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="glass glass-hover rounded-lg px-3 py-2 text-left text-[13px] text-white/85"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                m.role === "user"
                  ? "bg-white/10 text-white"
                  : "glass text-white/90"
              }`}
              style={
                m.role === "assistant"
                  ? { borderColor: `${domain.accent}33` }
                  : undefined
              }
            >
              {m.content || (
                <span className="inline-flex gap-1">
                  <Dot d={domain.accent} delay={0} />
                  <Dot d={domain.accent} delay={0.15} />
                  <Dot d={domain.accent} delay={0.3} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="glass flex items-end gap-2 rounded-xl px-3 py-2">
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (taRef.current) {
                taRef.current.style.height = "auto";
                taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + "px";
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={`Demander à ton copilote ${domain.label}…`}
            className="max-h-[120px] flex-1 resize-none bg-transparent py-1 text-[13.5px] text-white placeholder:text-muted/70 outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={streaming || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
            style={{ background: domain.accent, color: "#07080c" }}
            aria-label="Envoyer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot({ d, delay }: { d: string; delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
      style={{ background: d, animationDelay: `${delay}s` }}
    />
  );
}

const SUGGESTIONS: Record<string, string[]> = {
  sante: [
    "Analyse mes KPIs et donne-moi 3 priorités cette semaine.",
    "Propose une routine du matin de 20 minutes.",
  ],
  finances: [
    "Où optimiser mon taux d'épargne ?",
    "Fais le point sur mes projets financiers en cours.",
  ],
  business: [
    "Quels leviers pour passer de 14k à 20k de MRR ?",
    "Priorise mes projets business par impact.",
  ],
  travail: [
    "Construis mon plan de la semaine en blocs de focus.",
    "Comment réduire mes réunions sans friction ?",
  ],
  skills: [
    "Crée un plan d'apprentissage de 2 semaines pour le prompt engineering.",
    "Génère 5 questions de révision sur mes compétences actives.",
  ],
  knowledge: [
    "Aide-moi à structurer mes notes avec la méthode PARA.",
    "Résume les connexions entre mes projets de connaissance.",
  ],
  agents: [
    "Conçois un agent qui trie ma boîte mail.",
    "Quels garde-fous mettre sur mes agents autonomes ?",
  ],
};
