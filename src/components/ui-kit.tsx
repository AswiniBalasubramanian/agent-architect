import { X } from "lucide-react";
import { type ReactNode } from "react";
import type { DefectStatus, Priority, RunStatus, Severity, StepStatus } from "@/data/types";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("panel", className)}>{children}</div>;
}

export function Caps({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label-caps", className)}>{children}</div>;
}

const runTone: Record<RunStatus | StepStatus, string> = {
  Passed: "bg-pass/12 text-pass",
  Failed: "bg-fail/12 text-fail",
  Blocked: "bg-block/12 text-block",
  "In Progress": "bg-run/12 text-run",
  "Not Started": "bg-pending/20 text-muted-foreground",
};

const runDot: Record<RunStatus | StepStatus, string> = {
  Passed: "bg-pass",
  Failed: "bg-fail",
  Blocked: "bg-block",
  "In Progress": "bg-run animate-pulse",
  "Not Started": "bg-pending",
};

export function StatusPill({ status, className }: { status: RunStatus | StepStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-current/15 px-2 py-0.5 text-[10px] font-medium",
        runTone[status],
        className,
      )}
    >
      <i className={cn("size-1.5 rounded-full", runDot[status])} />
      {status}
    </span>
  );
}

const defectTone: Record<DefectStatus, string> = {
  New: "bg-fail/12 text-fail",
  Triaged: "bg-warn/12 text-warn",
  "In Progress": "bg-run/12 text-run",
  Resolved: "bg-pass/12 text-pass",
  Closed: "bg-pending/20 text-muted-foreground",
  Rejected: "bg-pending/20 text-muted-foreground",
};

export function DefectPill({ status }: { status: DefectStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border border-current/15 px-2 py-0.5 text-[10px] font-medium", defectTone[status])}>
      {status}
    </span>
  );
}

const sevTone: Record<Severity, string> = {
  "Sev 1": "bg-fail/12 text-fail",
  "Sev 2": "bg-warn/12 text-warn",
  "Sev 3": "bg-block/12 text-block",
  "Sev 4": "bg-pending/20 text-muted-foreground",
};

const sevLabel: Record<Severity, string> = {
  "Sev 1": "Critical",
  "Sev 2": "High",
  "Sev 3": "Medium",
  "Sev 4": "Low",
};

const sevDescription: Record<Severity, string> = {
  "Sev 1": "Critical / Blocker: A major system outage or severe defect with no workaround. Core business functions are down.",
  "Sev 2": "High / Major: A significant feature is broken or severely degraded, but some functions or workarounds may still exist.",
  "Sev 3": "Medium / Moderate: A non-critical feature is malfunctioning or displaying incorrect data.",
  "Sev 4": "Low / Minor: Cosmetic glitches, minor UI alignment issues, or small typos that do not impact functionality.",
};

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <Tooltip content={sevDescription[severity]}>
      <span className={cn("inline-flex items-center gap-1 rounded-md border border-current/15 px-2 py-0.5 text-[10px] font-medium", sevTone[severity])}>
        <i className="size-1.5 rounded-full bg-current" />
        {sevLabel[severity]}
      </span>
    </Tooltip>
  );
}

const prioTone: Record<Priority, string> = {
  Critical: "text-fail",
  High: "text-warn",
  Medium: "text-muted-foreground",
  Low: "text-muted-foreground",
};

export function PriorityTag({ priority }: { priority: Priority }) {
  return <span className={cn("font-mono text-[10px] font-medium", prioTone[priority])}>{priority}</span>;
}

export function Meter({
  segments,
  className,
}: {
  segments: { value: number; className: string; label?: string }[];
  className?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={cn("flex h-3 w-full overflow-hidden rounded-full bg-line/50", className)}>
      {segments.map((s, i) => (
        <div key={i} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} title={s.label} />
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; value: number; dot: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.label}>
          <i className={cn("mr-1 inline-block size-2 rounded-full", i.dot)} />
          {i.value} {i.label}
        </span>
      ))}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    ghost: "border border-border bg-background text-foreground hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <Caps className="mb-1">{label}</Caps>
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-[13px] text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-[72px]", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, props.className)} />;
}

export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/60 p-4 backdrop-blur-sm sm:p-6">
      <div className={cn("mt-10 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="font-display text-2xl leading-none font-semibold">{title}</h1>
        <p className="mt-2 text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">{children}</div>;
}
