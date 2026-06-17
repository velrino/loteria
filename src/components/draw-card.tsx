import { Ball } from "@/components/ball";
import { cn } from "@/lib/utils";
import { colors, countByColor, drawStats, type Draw } from "@/lib/lotteries";

type DrawCardProps = {
  draw: Draw;
  colored: boolean;
};

export function DrawCard({ draw, colored }: DrawCardProps) {
  const stats = drawStats(draw.dezenas);
  const perColor = colored ? countByColor(draw.dezenas) : [];

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">
          Concurso <span className="text-primary">{draw.concurso}</span>
        </h3>
        <time className="text-sm font-medium text-muted-foreground tabular-nums">
          {draw.data}
        </time>
      </div>

      <div className="flex flex-wrap gap-2">
        {draw.dezenas.map((dezena) => (
          <Ball key={dezena} value={dezena} colored={colored} />
        ))}
      </div>

      <dl className="mt-4 flex flex-wrap gap-2 text-sm">
        <Stat label="Pares" value={stats.even} />
        <Stat label="Ímpares" value={stats.odd} />
        <Stat label="Soma" value={stats.sum} />
      </dl>

      {colored && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quantidade por cor
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color, index) =>
              perColor[index] > 0 ? (
                <span
                  key={color.digit}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-1.5 pr-2.5 text-sm font-semibold"
                >
                  <span
                    className={cn("h-4 w-4 rounded-full", color.dot)}
                    aria-hidden
                  />
                  {perColor[index]}
                  <span className="font-normal text-muted-foreground">
                    {color.name}
                  </span>
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
