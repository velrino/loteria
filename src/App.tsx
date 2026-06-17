import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChartColumnBig,
  List,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ColorFrequency } from "@/components/color-frequency";
import { DrawCard } from "@/components/draw-card";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchDraws,
  getLottery,
  lotteries,
  type Draw,
  type LotteryKey,
} from "@/lib/lotteries";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const PAGE_SIZE = 20;

type Tab = "resultados" | "cores";
type SortOrder = "asc" | "desc";

type UrlState = {
  selected: LotteryKey;
  search: string;
  sortOrder: SortOrder;
  tab: Tab;
};

const DEFAULT_LOTTERY: LotteryKey = "mega-sena";
const DEFAULT_TAB: Tab = "resultados";
const DEFAULT_SORT: SortOrder = "desc";

function App() {
  const [selected, setSelected] = useState<LotteryKey>(
    () => readUrlState().selected,
  );
  const [searchTerm, setSearchTerm] = useState(() => readUrlState().search);
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => readUrlState().sortOrder,
  );
  const [draws, setDraws] = useState<Draw[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(() => readUrlState().tab);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const lottery = getLottery(selected);
  const showColors = lottery.colored;
  const filteredDraws = useMemo(
    () => filterAndSortDraws(draws, searchTerm, sortOrder),
    [draws, searchTerm, sortOrder],
  );

  useEffect(() => {
    let active = true;

    setStatus("loading");
    setError(null);
    setVisible(PAGE_SIZE);

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

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readUrlState();

      setSelected(next.selected);
      setSearchTerm(next.search);
      setSortOrder(next.sortOrder);
      setTab(next.tab);
    };

    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  useEffect(() => {
    writeUrlState({ selected, search: searchTerm, sortOrder, tab });
  }, [searchTerm, selected, sortOrder, tab]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [searchTerm, selected, sortOrder, tab]);

  useEffect(() => {
    if (!showColors && tab === "cores") {
      setTab(DEFAULT_TAB);
    }
  }, [showColors, tab]);

  const resultCountLabel =
    status === "ready"
      ? searchTerm.trim()
        ? `${numberFormatter.format(filteredDraws.length)} de ${numberFormatter.format(draws.length)} concursos`
        : `${numberFormatter.format(draws.length)} concursos`
      : "Resultados dos concursos";

  return (
    <div className="min-h-screen">
      <Navbar selected={selected} onSelect={setSelected} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lottery.label}</h1>
            <p className="text-sm text-muted-foreground">
              {resultCountLabel}
            </p>
          </div>
        </div>

        <div className="mb-5 grid gap-3 rounded-xl border bg-card p-3 shadow-sm">
          <div className="relative">
            <label htmlFor="draw-search" className="sr-only">
              Buscar por concurso ou dezenas
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="draw-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Concurso ou dezenas"
              className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-11 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
                aria-label="Limpar busca"
                title="Limpar busca"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SortButton
              active={sortOrder === "desc"}
              onClick={() => setSortOrder("desc")}
              icon={<ArrowDownWideNarrow className="h-5 w-5" />}
              label="Desc"
            />
            <SortButton
              active={sortOrder === "asc"}
              onClick={() => setSortOrder("asc")}
              icon={<ArrowUpNarrowWide className="h-5 w-5" />}
              label="Asc"
            />
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
            {filteredDraws.slice(0, visible).map((draw) => (
              <DrawCard
                key={draw.concurso}
                draw={draw}
                colored={showColors}
              />
            ))}

            {filteredDraws.length === 0 && (
              <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
                Nenhum concurso encontrado.
              </div>
            )}

            {visible < filteredDraws.length && (
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
          filteredDraws.length > 0 ? (
            <ColorFrequency draws={filteredDraws} lottery={lottery} />
          ) : (
            <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
              Nenhum concurso encontrado.
            </div>
          )
        )}
      </main>

      <ThemeToggle />
    </div>
  );
}

function readUrlState(): UrlState {
  if (typeof window === "undefined") {
    return {
      selected: DEFAULT_LOTTERY,
      search: "",
      sortOrder: DEFAULT_SORT,
      tab: DEFAULT_TAB,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const selected = parseLotteryKey(
    params.get("modalidade") ?? params.get("jogo") ?? params.get("lottery"),
  );
  const search = params.get("busca") ?? params.get("q") ?? "";
  const sortOrder = parseSortOrder(params.get("ordem") ?? params.get("sort"));
  const tab = parseTab(params.get("aba") ?? params.get("tab"));

  return { selected, search, sortOrder, tab };
}

function writeUrlState({ selected, search, sortOrder, tab }: UrlState) {
  const params = new URLSearchParams();

  params.set("modalidade", selected);
  params.set("ordem", sortOrder);

  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    params.set("busca", normalizedSearch);
  }

  if (tab !== DEFAULT_TAB) {
    params.set("aba", tab);
  }

  const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;

  if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function parseLotteryKey(value: string | null): LotteryKey {
  const aliases: Record<string, LotteryKey> = {
    mega: "mega-sena",
    megasena: "mega-sena",
    "mega-sena": "mega-sena",
    quina: "quina",
    lotofacil: "lotofacil",
    lotofácil: "lotofacil",
  };

  if (value && aliases[value.toLowerCase()]) {
    return aliases[value.toLowerCase()];
  }

  return lotteries.some((lottery) => lottery.key === value)
    ? (value as LotteryKey)
    : DEFAULT_LOTTERY;
}

function parseSortOrder(value: string | null): SortOrder {
  return value === "asc" || value === "crescente" ? "asc" : DEFAULT_SORT;
}

function parseTab(value: string | null): Tab {
  return value === "cores" ? "cores" : DEFAULT_TAB;
}

function filterAndSortDraws(
  draws: Draw[],
  search: string,
  sortOrder: SortOrder,
) {
  const numbers = extractNumbers(search);
  const normalized = search.trim();
  const filtered = normalized
    ? numbers.length > 0
      ? draws.filter((draw) => matchesSearch(draw, numbers))
      : []
    : draws;

  return [...filtered].sort((a, b) =>
    sortOrder === "asc"
      ? a.concurso - b.concurso
      : b.concurso - a.concurso,
  );
}

function matchesSearch(draw: Draw, numbers: number[]) {
  if (numbers.length === 0) {
    return true;
  }

  const matchesConcurso = numbers.length === 1 && draw.concurso === numbers[0];
  const matchesDezenas = numbers.every((number) =>
    draw.dezenas.includes(number),
  );

  return matchesConcurso || matchesDezenas;
}

function extractNumbers(value: string) {
  return (value.match(/\d+/g) ?? []).map(Number);
}

function SortButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-lg border text-base font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "bg-background text-muted-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
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
  icon: ReactNode;
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
