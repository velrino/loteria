import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLottery, lotteries, type LotteryKey } from "@/lib/lotteries";

type NavbarProps = {
  selected: LotteryKey;
  onSelect: (key: LotteryKey) => void;
};

export function Navbar({ selected, onSelect }: NavbarProps) {
  const accent = getLottery(selected).accent;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-normal">Loteria</span>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="lottery-select" className="sr-only">
            Modalidade
          </label>
          <div className="relative">
            <span
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full",
                accent,
              )}
            />
            <select
              id="lottery-select"
              value={selected}
              onChange={(event) => onSelect(event.target.value as LotteryKey)}
              className="h-10 cursor-pointer rounded-md border border-input bg-background pl-7 pr-9 text-sm font-medium shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              {lotteries.map((lottery) => (
                <option key={lottery.key} value={lottery.key}>
                  {lottery.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
