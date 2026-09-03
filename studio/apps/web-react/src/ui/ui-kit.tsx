import type { ReactNode } from 'react';

export type IconName =
  | 'spark' | 'identity' | 'stats' | 'colors' | 'skills'
  | 'crown' | 'shield' | 'upload' | 'plus' | 'trash' | 'check' | 'warning';

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    spark:    <path d="m12 3-1.7 5.3L5 10l5.3 1.7L12 17l1.7-5.3L19 10l-5.3-1.7L12 3Z" />,
    identity: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    stats:    <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />,
    colors:   <><circle cx="8" cy="8" r="4" /><circle cx="16" cy="8" r="4" /><circle cx="12" cy="15" r="4" /></>,
    skills:   <path d="m12 2 2.2 6.8H21l-5.5 4 2.1 6.7-5.6-4.1-5.6 4.1 2.1-6.7-5.5-4h6.8L12 2Z" />,
    crown:    <><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" /><path d="M5 19h14" /></>,
    shield:   <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />,
    upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></>,
    plus:     <path d="M12 5v14M5 12h14" />,
    trash:    <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />,
    check:    <path d="m5 12 4 4L19 6" />,
    warning:  <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  };
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

export const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/[0.14] focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10';

export function Field({ label, hint, required, children, className = '' }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
        {required && <span className="text-amber-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Section({ id, icon, eyebrow, title, description, children }: {
  id?: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10" id={id}>
      <div className="flex items-start gap-4 border-b border-white/[0.06] px-6 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
          <Icon name={icon} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">{eyebrow}</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function SkillPicker({ skills, selected, unavailable = [], onChange }: {
  skills: readonly { id: string; displayName: string }[];
  selected: readonly string[];
  unavailable?: readonly string[];
  onChange: (skills: readonly string[]) => void;
}) {
  if (skills.length === 0) {
    return <p className="text-xs text-slate-600">Aucune compétence disponible.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2">
      {skills.map((skill) => {
        const active = selected.includes(skill.id);
        const disabled = unavailable.includes(skill.id);
        return (
          <button
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
              active
                ? 'border-amber-400/35 bg-amber-400/10 text-amber-100'
                : disabled
                  ? 'cursor-not-allowed border-white/[0.04] bg-slate-950/20 text-slate-600 opacity-55'
                  : 'border-white/[0.07] bg-slate-950/45 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
            }`}
            disabled={disabled}
            key={skill.id}
            onClick={() => onChange(active ? selected.filter((id) => id !== skill.id) : [...selected, skill.id])}
            type="button"
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${active ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'}`}>
              {active && <Icon className="size-3.5" name="check" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{skill.displayName}</span>
              <span className="block truncate text-[11px] text-slate-500">{skill.id}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
