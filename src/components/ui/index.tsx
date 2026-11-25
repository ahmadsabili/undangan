"use client";

// Komponen dasar dashboard (gaya shadcn/ui, ditulis langsung tanpa CLI registry).
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, X } from "lucide-react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ---------- Button ----------
const button = cva(
  "inline-flex min-h-[40px] items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-admin-brand text-white hover:bg-[#363b32] active:bg-[#2b2f28]",
        secondary: "border border-admin-line bg-white text-admin-ink hover:bg-[#F0EEE8] active:bg-[#E8E5DD]",
        ghost: "text-admin-ink hover:bg-black/[0.05] active:bg-black/[0.08]",
        danger: "bg-admin-danger text-white hover:bg-[#8a3123] active:bg-[#74281d]",
        dangerGhost: "text-admin-danger hover:bg-admin-danger/[0.08]",
      },
      size: { sm: "min-h-[34px] px-3 text-[0.8rem]", md: "", icon: "h-10 w-10 px-0" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(button({ variant, size }), className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export const buttonClass = button;

// ---------- Form controls ----------
const control =
  "w-full rounded-md border border-admin-line bg-white px-3 py-2 text-sm text-admin-ink placeholder:text-admin-muted/70 focus:border-admin-brand focus:outline-none focus:ring-2 focus:ring-admin-brand/20 disabled:bg-[#F3F2EE] aria-[invalid=true]:border-admin-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(control, "min-h-[40px]", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-[80px] resize-y leading-relaxed", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(control, "min-h-[40px] min-w-0 max-w-full pr-8", className)} {...rest}>
      {children}
    </select>
  );
});

export function Field({
  label,
  htmlFor,
  help,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-admin-ink">
        {label}
      </label>
      {children}
      {help && !error && <p className="text-xs leading-relaxed text-admin-muted">{help}</p>}
      {error && (
        <p className="text-xs text-admin-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-admin-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-admin-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-admin-brand" : "bg-[#CFCBC0]",
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

// ---------- Layout ----------
export function Card({ children, className, title, description, actions }: { children: ReactNode; className?: string; title?: string; description?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-admin-line bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-admin-line px-5 py-4">
          <div>
            {title && <h2 className="text-[0.95rem] font-semibold text-admin-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-admin-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-[2rem] leading-tight text-admin-ink" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {title}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-admin-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" | "info" }) {
  const tones = {
    neutral: "bg-[#EEECE6] text-admin-ink",
    ok: "bg-[#E3EEE4] text-[#2F5636]",
    warn: "bg-[#F6EBD5] text-[#6B4A12]",
    danger: "bg-[#F5E1DD] text-[#7E2A1D]",
    info: "bg-[#E3E8EE] text-[#2C4157]",
  };
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-admin-line px-6 py-12 text-center">
      <p className="font-medium text-admin-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-admin-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-admin-danger/30 bg-[#FBF1EF] px-5 py-4 text-sm text-[#7E2A1D]">
      <p>{message}</p>
      {onRetry && (
        <Button size="sm" className="mt-3" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Memuat" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-[#ECEAE4]" />
      ))}
    </div>
  );
}

// ---------- Dialog ----------
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (x) => !x.hasAttribute("disabled"),
      );
    (focusables().find((x) => x.tagName !== "BUTTON") ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return createPortal(
    <div className="admin fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 font-admin sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn("flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl", widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-admin-line px-5 py-4">
          <div>
            <h2 id={titleId} className="font-semibold text-admin-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-admin-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup dialog">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-admin-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---------- Confirm ----------
type ConfirmOpts = { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

// ---------- Toast ----------
type Toast = { id: number; kind: "ok" | "error" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function AdminProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);

  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);

  const ask = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirm({ ...o, resolve })), []);
  const close = (v: boolean) => {
    confirm?.resolve(v);
    setConfirm(null);
  };

  return (
    <ToastCtx.Provider value={push}>
      <ConfirmCtx.Provider value={ask}>
        {children}
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg",
                t.kind === "error" ? "bg-admin-danger text-white" : t.kind === "ok" ? "bg-admin-brand text-white" : "bg-admin-ink text-white",
              )}
            >
              {t.text}
            </div>
          ))}
        </div>
        <Dialog
          open={Boolean(confirm)}
          onClose={() => close(false)}
          title={confirm?.title ?? ""}
          size="sm"
          footer={
            <>
              <Button onClick={() => close(false)}>Batal</Button>
              <Button variant={confirm?.danger ? "danger" : "primary"} onClick={() => close(true)}>
                {confirm?.confirmLabel ?? "Lanjutkan"}
              </Button>
            </>
          }
        >
          {confirm?.body && <div className="text-sm leading-relaxed text-admin-muted">{confirm.body}</div>}
        </Dialog>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
