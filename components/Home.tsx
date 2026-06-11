"use client";

import type { TodoItem } from "@/lib/types";
import { DailyTodo } from "./DailyTodo";

interface Props {
  todos: TodoItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<TodoItem>) => void;
  onRemove: (id: string) => void;
}

export function Home({ todos, onAdd, onUpdate, onRemove }: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting =
    hour < 6 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bel après-midi" : "Bonsoir";

  const top1 = todos.filter((t) => t.priority === "top1" && !t.done).length;

  return (
    <div className="animate-fade-up">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
        {dateStr}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {greeting}.
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Actions du jour — {todos.filter((t) => !t.done).length} à faire
        {top1 > 0 && (
          <>
            {" · "}
            <span style={{ color: "#f6708a" }}>{top1} en Top&nbsp;1</span>
          </>
        )}
      </p>

      <div className="mt-6 max-w-3xl">
        <DailyTodo todos={todos} onAdd={onAdd} onUpdate={onUpdate} onRemove={onRemove} />
      </div>
    </div>
  );
}
