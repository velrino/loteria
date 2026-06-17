import { useMemo } from "react";
import { Ball } from "@/components/ball";
import { cn } from "@/lib/utils";
import {
  colorDistributions,
  dezenasDaCor,
  type Draw,
  type Lottery,
} from "@/lib/lotteries";

const pctFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

type ColorFrequencyProps = {
  draws: Draw[];
  lottery: Lottery;
};

export function ColorFrequency({ draws, lottery }: ColorFrequencyProps) {
  const picks = draws[0]?.dezenas.length ?? 0;
  const distributions = useMemo(
    () => colorDistributions(draws, picks),
    [draws, picks],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Em quantos sorteios cada cor aparece e com que frequência, considerando
        todos os {draws.length} concursos.
      </p>

      {distributions.map(({ color, rows }) => (
        <section
          key={color.digit}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <header className={cn("flex flex-wrap items-center gap-2 p-4", color.soft)}>
            <h3 className="mr-1 text-base font-bold">Cor {color.name}</h3>
            {dezenasDaCor(color, lottery.range).map((dezena) => (
              <Ball key={dezena} value={dezena} size="sm" />
            ))}
          </header>

          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.quantidade} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-24 shrink-0 text-sm font-medium">
                  {row.quantidade === 0
                    ? "Nenhuma"
                    : `${row.quantidade} ${row.quantidade === 1 ? "bola" : "bolas"}`}
                </span>
                <span className="w-12 shrink-0 text-sm font-bold tabular-nums">
                  {row.vezes}x
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {pctFormatter.format(row.pct)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
