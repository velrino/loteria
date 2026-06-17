import { cn } from "@/lib/utils";
import { ballColorClass } from "@/lib/lotteries";

function format(value: number) {
  return String(value).padStart(2, "0");
}

type BallProps = {
  value: number;
  /** Usa a cor oficial por dígito. Caso contrário, estilo neutro. */
  colored?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function Ball({ value, colored = true, size = "md", className }: BallProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold tabular-nums shadow-sm",
        size === "md" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm",
        colored
          ? ballColorClass(value)
          : "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      {format(value)}
    </span>
  );
}
