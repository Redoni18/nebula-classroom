// A headline card at the top of an admin page: a label, one big number, one line.

export function StatCard({ label, value, line, accent = false }: { label: string; value: string | number; line: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-xl bg-lime p-4 md:p-5" : "rounded-xl border border-cream-line bg-paper p-4 md:p-5"}>
      <p className="text-sm font-semibold text-ink/70">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink/60">{line}</p>
    </div>
  );
}
