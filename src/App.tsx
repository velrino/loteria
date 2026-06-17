import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChartColumnBig,
  CircleDot,
  Hash,
  LayoutList,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ColorFrequency } from "@/components/color-frequency";
import { DrawCard } from "@/components/draw-card";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip } from "@/components/ui/tooltip";
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
type SearchMode = "concurso" | "resultado";
type FrequencyLimit = "all" | number;

type UrlState = {
  selected: LotteryKey;
  search: string;
  searchMode: SearchMode;
  sortOrder: SortOrder;
  tab: Tab;
  frequencyLimit: FrequencyLimit;
};

const DEFAULT_LOTTERY: LotteryKey = "mega-sena";
const DEFAULT_TAB: Tab = "resultados";
const DEFAULT_SORT: SortOrder = "desc";
const DEFAULT_SEARCH_MODE: SearchMode = "concurso";
const DEFAULT_FREQUENCY_LIMIT: FrequencyLimit = "all";
const FREQUENCY_PRESETS = [5, 10, 25, 50] as const;

function App() {
  const [selected, setSelected] = useState<LotteryKey>(
    () => readUrlState().selected,
  );
  const [searchTerm, setSearchTerm] = useState(() => readUrlState().search);
  const [searchMode, setSearchMode] = useState<SearchMode>(
    () => readUrlState().searchMode,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => readUrlState().sortOrder,
  );
  const [frequencyLimit, setFrequencyLimit] = useState<FrequencyLimit>(
    () => readUrlState().frequencyLimit,
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
    () => filterAndSortDraws(draws, searchTerm, searchMode, sortOrder),
    [draws, searchMode, searchTerm, sortOrder],
  );
  const frequencyDraws = useMemo(
    () => selectFrequencyDraws(filteredDraws, frequencyLimit),
    [filteredDraws, frequencyLimit],
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
      setSearchMode(next.searchMode);
      setSortOrder(next.sortOrder);
      setTab(next.tab);
      setFrequencyLimit(next.frequencyLimit);
    };

    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  useEffect(() => {
    writeUrlState({
      selected,
      search: searchTerm,
      searchMode,
      sortOrder,
      tab,
      frequencyLimit,
    });
  }, [frequencyLimit, searchMode, searchTerm, selected, sortOrder, tab]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [searchMode, searchTerm, selected, sortOrder, tab]);

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
  const searchPlaceholder =
    searchMode === "concurso" ? "Número do concurso" : "Dezenas sorteadas";
  const frequencyScopeLabel = formatFrequencyScopeLabel(
    frequencyDraws.length,
    filteredDraws.length,
  );

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

        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Tooltip
              label={
                searchMode === "concurso"
                  ? "Buscando pelo número do concurso. Toque para buscar por dezenas."
                  : "Buscando pelas dezenas sorteadas. Toque para buscar por concurso."
              }
            >
              <button
                type="button"
                onClick={() =>
                  setSearchMode(
                    searchMode === "concurso" ? "resultado" : "concurso",
                  )
                }
                aria-label={
                  searchMode === "concurso"
                    ? "Modo: buscar por concurso. Toque para buscar por dezenas."
                    : "Modo: buscar por dezenas. Toque para buscar por concurso."
                }
                className="flex h-11 items-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent"
              >
                {searchMode === "concurso" ? (
                  <Hash className="h-4 w-4 text-primary" />
                ) : (
                  <CircleDot className="h-4 w-4 text-primary" />
                )}
                {searchMode === "concurso" ? "Concurso" : "Resultado"}
              </button>
            </Tooltip>

            <Segmented
              value={sortOrder}
              onChange={setSortOrder}
              className="h-11 p-1"
              options={[
                {
                  value: "desc",
                  icon: <ArrowDownWideNarrow className="h-4 w-4" />,
                  ariaLabel: "Mais recentes primeiro",
                },
                {
                  value: "asc",
                  icon: <ArrowUpNarrowWide className="h-4 w-4" />,
                  ariaLabel: "Mais antigos primeiro",
                },
              ]}
            />
          </div>

          <div className="relative">
            <label htmlFor="draw-search" className="sr-only">
              {searchPlaceholder}
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="draw-search"
              value={searchTerm}
              inputMode={searchMode === "concurso" ? "numeric" : "text"}
              onChange={(event) =>
                setSearchTerm(event.target.value.replace(/[^\d\s,]/g, ""))
              }
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-10 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>

        {showColors && status === "ready" && (
          <div className="mb-5">
            <Segmented
              fullWidth
              value={tab}
              onChange={setTab}
              options={[
                {
                  value: "resultados",
                  label: "Resultados",
                  icon: <LayoutList className="h-4 w-4" />,
                },
                {
                  value: "cores",
                  label: "Cores",
                  icon: <ChartColumnBig className="h-4 w-4" />,
                },
              ]}
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
            <div className="space-y-5">
              <FrequencyScopeControl
                value={frequencyLimit}
                max={filteredDraws.length}
                onChange={setFrequencyLimit}
              />
              <ColorFrequency
                draws={frequencyDraws}
                lottery={lottery}
                scopeLabel={frequencyScopeLabel}
              />
            </div>
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
      searchMode: DEFAULT_SEARCH_MODE,
      sortOrder: DEFAULT_SORT,
      tab: DEFAULT_TAB,
      frequencyLimit: DEFAULT_FREQUENCY_LIMIT,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const selected = parseLotteryKey(
    params.get("modalidade") ?? params.get("jogo") ?? params.get("lottery"),
  );
  const search = params.get("busca") ?? params.get("q") ?? "";
  const searchMode = parseSearchMode(params.get("tipo"), search);
  const sortOrder = parseSortOrder(params.get("ordem") ?? params.get("sort"));
  const tab = parseTab(params.get("aba") ?? params.get("tab"));
  const frequencyLimit = parseFrequencyLimit(
    params.get("amostra") ?? params.get("ultimos"),
  );

  return { selected, search, searchMode, sortOrder, tab, frequencyLimit };
}

function writeUrlState({
  selected,
  search,
  searchMode,
  sortOrder,
  tab,
  frequencyLimit,
}: UrlState) {
  const params = new URLSearchParams();

  params.set("modalidade", selected);
  params.set("tipo", searchMode);
  params.set("ordem", sortOrder);

  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    params.set("busca", normalizedSearch);
  }

  if (tab !== DEFAULT_TAB) {
    params.set("aba", tab);
  }

  if (frequencyLimit !== DEFAULT_FREQUENCY_LIMIT) {
    params.set("amostra", String(frequencyLimit));
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

function parseSearchMode(value: string | null, search: string): SearchMode {
  if (value === "resultado" || value === "resultados" || value === "dezenas") {
    return "resultado";
  }

  if (value === "concurso") {
    return "concurso";
  }

  return extractNumbers(search).length > 1 ? "resultado" : DEFAULT_SEARCH_MODE;
}

function parseFrequencyLimit(value: string | null): FrequencyLimit {
  if (!value || value === "todos" || value === "all") {
    return DEFAULT_FREQUENCY_LIMIT;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_FREQUENCY_LIMIT;
}

function parseTab(value: string | null): Tab {
  return value === "cores" ? "cores" : DEFAULT_TAB;
}

function filterAndSortDraws(
  draws: Draw[],
  search: string,
  searchMode: SearchMode,
  sortOrder: SortOrder,
) {
  const numbers = extractNumbers(search);
  const normalized = search.trim();
  const filtered = normalized
    ? numbers.length > 0
      ? draws.filter((draw) => matchesSearch(draw, numbers, searchMode))
      : []
    : draws;

  return [...filtered].sort((a, b) =>
    sortOrder === "asc"
      ? a.concurso - b.concurso
      : b.concurso - a.concurso,
  );
}

function matchesSearch(draw: Draw, numbers: number[], searchMode: SearchMode) {
  if (numbers.length === 0) {
    return true;
  }

  if (searchMode === "concurso") {
    return numbers.some((number) => draw.concurso === number);
  }

  return numbers.every((number) => draw.dezenas.includes(number));
}

function extractNumbers(value: string) {
  return (value.match(/\d+/g) ?? []).map(Number);
}

function selectFrequencyDraws(draws: Draw[], frequencyLimit: FrequencyLimit) {
  if (frequencyLimit === "all") {
    return draws;
  }

  return [...draws]
    .sort((a, b) => b.concurso - a.concurso)
    .slice(0, frequencyLimit);
}

function formatFrequencyScopeLabel(sampleCount: number, totalCount: number) {
  if (sampleCount === totalCount) {
    return `todos os ${numberFormatter.format(totalCount)} concursos`;
  }

  return `os últimos ${numberFormatter.format(sampleCount)} de ${numberFormatter.format(totalCount)} concursos`;
}

function FrequencyScopeControl({
  value,
  max,
  onChange,
}: {
  value: FrequencyLimit;
  max: number;
  onChange: (value: FrequencyLimit) => void;
}) {
  const customValue =
    typeof value === "number" && !isFrequencyPreset(value)
      ? String(value)
      : "";

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Amostra
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={isFrequencyPreset(value) || value === "all" ? value : "all"}
          onChange={onChange}
          size="sm"
          options={[
            { value: "all", label: "Todos" },
            ...FREQUENCY_PRESETS.map((preset) => ({
              value: preset,
              label: String(preset),
            })),
          ]}
        />
        <label htmlFor="frequency-custom" className="sr-only">
          Outro número de concursos
        </label>
        <input
          id="frequency-custom"
          type="number"
          min={1}
          max={Math.max(max, 1)}
          inputMode="numeric"
          value={customValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            onChange(
              Number.isInteger(nextValue) && nextValue > 0 ? nextValue : "all",
            );
          }}
          placeholder="Outro"
          className={cn(
            "h-9 w-24 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
            customValue && "border-primary",
          )}
        />
      </div>
    </div>
  );
}

function isFrequencyPreset(
  value: FrequencyLimit,
): value is (typeof FREQUENCY_PRESETS)[number] {
  return FREQUENCY_PRESETS.some((preset) => preset === value);
}

export default App;
