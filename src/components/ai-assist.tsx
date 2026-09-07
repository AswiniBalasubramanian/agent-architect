import { Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, Caps, Spinner } from "@/components/ui-kit";
import { runWithPhases, phaseLabel, type AiPhase } from "@/lib/ai";
import { cn } from "@/lib/utils";

/**
 * Small assistant surface: a trigger, a visible thinking sequence and a result
 * block the user can accept. Result production is synchronous and deterministic;
 * the phases exist so the intermediate state is always shown.
 */
export function AiAssist<T>({
  title,
  hint,
  cta,
  produce,
  render,
  onAccept,
  acceptLabel = "Apply",
  disabled,
  className,
}: {
  title: string;
  hint: string;
  cta: string;
  produce: () => T;
  render: (result: T) => ReactNode;
  onAccept?: (result: T) => void;
  acceptLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [phase, setPhase] = useState<AiPhase>("idle");
  const [result, setResult] = useState<T | null>(null);

  const busy = phase === "reading" || phase === "drafting" || phase === "checking";

  const run = async () => {
    setResult(null);
    try {
      const value = await runWithPhases(setPhase, produce);
      setResult(value);
    } catch {
      setPhase("error");
    }
  };

  return (
    <div className={cn("panel space-y-3 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Caps className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent-foreground" />
            {title}
          </Caps>
          <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>
        </div>
        <Button variant="secondary" onClick={run} disabled={busy || !!disabled}>
          {busy ? <Spinner /> : <Sparkles className="size-3.5" />}
          {busy ? "Working…" : cta}
        </Button>
      </div>

      {busy ? (
        <div className="space-y-1.5 rounded-lg border border-dashed border-border bg-muted/40 p-3">
          {(["reading", "drafting", "checking"] as AiPhase[]).map((p) => {
            const order = ["reading", "drafting", "checking"];
            const done = order.indexOf(p) < order.indexOf(phase);
            const active = p === phase;
            return (
              <div
                key={p}
                className={cn(
                  "flex items-center gap-2 text-[12px]",
                  active ? "text-foreground" : done ? "text-muted-foreground line-through" : "text-muted-foreground/60",
                )}
              >
                {active ? <Spinner /> : <span className="inline-block size-1.5 rounded-full bg-current" />}
                {phaseLabel[p]}
              </div>
            );
          })}
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[12px] text-destructive">
          The assistant could not complete that request. Try again.
        </div>
      ) : null}

      {result !== null && !busy ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12px]">{render(result)}</div>
          <div className="flex items-center gap-2">
            {onAccept ? (
              <Button
                onClick={() => {
                  onAccept(result);
                  setResult(null);
                  setPhase("idle");
                }}
              >
                {acceptLabel}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setPhase("idle");
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
