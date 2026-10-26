// The design's section headline: heavy uppercase words, the last part set on
// a slightly tilted box ("WAYS TO [BOOK]", "WHAT WILL YOU [TEACH HERE?]").
// `parts` comes straight from the dictionary: [plain, marked].

import { cn } from "@/lib/utils";

type Tone = "lime" | "ink";

export function Marked({ children, tone = "lime", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block -rotate-1 px-[0.18em] pb-[0.06em] pt-[0.12em] [box-decoration-break:clone]",
        tone === "lime" ? "bg-lime text-ink" : "bg-ink text-lime",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  parts,
  tone = "lime",
  stacked = false,
  as: Tag = "h2",
  id,
  className,
}: {
  parts: string[];
  tone?: Tone;
  /** Put the marked part on its own line (as in "What will you / teach here?"). */
  stacked?: boolean;
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}) {
  const [plain, marked] = parts;
  return (
    <Tag id={id} className={cn("font-display text-[clamp(2.25rem,4.6vw,4.25rem)]", className)}>
      {plain}{" "}
      {stacked && <br />}
      <Marked tone={tone} className={stacked ? "mt-[0.08em]" : undefined}>
        {marked}
      </Marked>
    </Tag>
  );
}
