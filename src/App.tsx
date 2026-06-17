import { ChartColumnBig, List, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ColorFrequency } from "@/components/color-frequency";
import { DrawCard } from "@/components/draw-card";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchDraws,
  getLottery,
  type Draw,
  type LotteryKey,
} from "@/lib/lotteries";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const PAGE_SIZE = 20;

type Tab = "resultados" | "cores";

function App() {
  const [selected, setSelected] = useState<LotteryKey>("mega-sena");
  const [draws, setDraws] = useState<Draw[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("resultados");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const lottery = getLottery(selected);

  useEffect(() => {
    let active = true;

    setStatus("loading");
    setError(null);
    setVisible(PAGE_SIZE);
    setTab("resultados");

    fetchDraws(lottery)
      .then((data) => {
        if (!active) return;
        setDraws(data);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Erro ao carregar.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [lottery]);

  const showColors = lottery.colored;

  return (
    <div className="min-h-screen">
      <Navbar selected={selected} onSelect={setSelected} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lottery.label}</h1>
            <p className="text-sm text-muted-foreground">
              {status === "ready"
                ? `${numberFormatter.format(draws.length)} concursos`
                : "Resultados dos concursos"}
            </p>
          </div>
        </div>

        {showColors && status === "ready" && (
          <div className="mb-5 grid grid-cols-2 gap-2">
            <TabButton
              active={tab === "resultados"}
              onClick={() => setTab("resultados")}
              icon={<List className="h-5 w-5" />}
              label="Resultados"
            />
            <TabButton
              active={tab === "cores"}
              onClick={() => setTab("cores")}
              icon={<ChartColumnBig className="h-5 w-5" />}
              label="Cores"
            />
          </div>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 rounded-xl border py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando concursos…
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 py-20 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {status === "ready" && tab === "resultados" && (
          <div className="space-y-3">
            {draws.slice(0, visible).map((draw) => (
              <DrawCard
                key={draw.concurso}
                draw={draw}
                colored={showColors}
              />
            ))}

            {visible < draws.length && (
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full text-base"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
              >
                Mostrar mais
              </Button>
            )}
          </div>
        )}

        {status === "ready" && tab === "cores" && showColors && (
          <ColorFrequency draws={draws} lottery={lottery} />
        )}
      </main>

      <ThemeToggle />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-lg border text-base font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
