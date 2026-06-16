import { Copy, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const games = {
  mega: {
    label: "Mega-Sena",
    range: 60,
    min: 6,
    max: 15,
    defaultCount: 6,
    accent: "bg-emerald-500",
  },
  quina: {
    label: "Quina",
    range: 80,
    min: 5,
    max: 15,
    defaultCount: 5,
    accent: "bg-amber-500",
  },
  lotofacil: {
    label: "Lotofacil",
    range: 25,
    min: 15,
    max: 20,
    defaultCount: 15,
    accent: "bg-rose-500",
  },
} as const;

type GameKey = keyof typeof games;
type GameConfig = (typeof games)[GameKey];

const numberFormatter = new Intl.NumberFormat("pt-BR");

function createNumbers(range: number, count: number) {
  const pool = Array.from({ length: range }, (_, index) => index + 1);
  const selected: number[] = [];

  while (selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [value] = pool.splice(index, 1);
    selected.push(value);
  }

  return selected.sort((a, b) => a - b);
}

function formatNumber(value: number) {
  return String(value).padStart(2, "0");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function combinations(total: number, picks: number) {
  let result = 1;

  for (let index = 1; index <= picks; index += 1) {
    result = (result * (total - picks + index)) / index;
  }

  return Math.round(result);
}

function App() {
  const [game, setGame] = useState<GameKey>("mega");
  const [quantity, setQuantity] = useState<number>(games.mega.defaultCount);
  const [numbers, setNumbers] = useState(() =>
    createNumbers(games.mega.range, games.mega.defaultCount),
  );
  const [copied, setCopied] = useState(false);

  const selectedGame = games[game];
  const odds = useMemo(
    () => combinations(selectedGame.range, quantity),
    [quantity, selectedGame.range],
  );

  function generate(
    nextQuantity: number = quantity,
    nextGame: GameConfig = selectedGame,
  ) {
    setNumbers(createNumbers(nextGame.range, nextQuantity));
    setCopied(false);
  }

  function selectGame(nextGame: GameKey) {
    const config = games[nextGame];
    setGame(nextGame);
    setQuantity(config.defaultCount);
    generate(config.defaultCount, config);
  }

  function changeQuantity(delta: number) {
    const nextQuantity = clamp(
      quantity + delta,
      selectedGame.min,
      selectedGame.max,
    );

    setQuantity(nextQuantity);
    generate(nextQuantity);
  }

  async function copyNumbers() {
    const text = numbers.map(formatNumber).join(" ");
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-semibold tracking-normal">
                Loteria
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Gerador de jogos para apostas simples.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{selectedGame.label}</CardTitle>
                  <CardDescription>
                    {quantity} dezenas entre 01 e {selectedGame.range}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  1 em {numberFormatter.format(odds)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-8">
                {numbers.map((number) => (
                  <li
                    key={number}
                    className="flex aspect-square min-h-16 items-center justify-center rounded-full border bg-primary/10 text-xl font-semibold text-primary shadow-sm"
                  >
                    {formatNumber(number)}
                  </li>
                ))}
              </ol>

              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
                <Button className="sm:flex-1" onClick={() => generate()}>
                  <RotateCcw />
                  Gerar jogo
                </Button>
                <Button
                  className="sm:flex-1"
                  variant="outline"
                  onClick={copyNumbers}
                >
                  <Copy />
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Modalidade</CardTitle>
                <CardDescription>Escolha o volante.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {(Object.keys(games) as GameKey[]).map((key) => {
                  const config = games[key];
                  const isSelected = game === key;

                  return (
                    <Button
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      className="h-11 justify-start"
                      onClick={() => selectGame(key)}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          config.accent,
                        )}
                      />
                      {config.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dezenas</CardTitle>
                <CardDescription>
                  {selectedGame.min} a {selectedGame.max} por jogo.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  title="Diminuir"
                  aria-label="Diminuir"
                  disabled={quantity <= selectedGame.min}
                  onClick={() => changeQuantity(-1)}
                >
                  <Minus />
                </Button>
                <div className="min-w-24 text-center">
                  <strong className="block text-3xl font-semibold">
                    {quantity}
                  </strong>
                  <span className="text-xs uppercase text-muted-foreground">
                    dezenas
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  title="Aumentar"
                  aria-label="Aumentar"
                  disabled={quantity >= selectedGame.max}
                  onClick={() => changeQuantity(1)}
                >
                  <Plus />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
      <ThemeToggle />
    </main>
  );
}

export default App;
