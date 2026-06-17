export type LotteryKey = "mega-sena" | "quina" | "lotofacil";

export type Lottery = {
  key: LotteryKey;
  label: string;
  file: string;
  range: number;
  accent: string;
  /** Quando true, as bolas seguem o padrão oficial de cores por dígito. */
  colored: boolean;
};

export type Draw = {
  concurso: number;
  data: string;
  dezenas: number[];
  situacao: string;
};

export const lotteries: Lottery[] = [
  {
    key: "mega-sena",
    label: "Mega-Sena",
    file: "mega-sena.json",
    range: 60,
    accent: "bg-emerald-500",
    colored: true,
  },
  {
    key: "quina",
    label: "Quina",
    file: "quina.json",
    range: 80,
    accent: "bg-amber-500",
    colored: true,
  },
  {
    key: "lotofacil",
    label: "Lotofácil",
    file: "lotofacil.json",
    range: 25,
    accent: "bg-rose-500",
    colored: false,
  },
];

export function getLottery(key: LotteryKey): Lottery {
  return lotteries.find((lottery) => lottery.key === key) ?? lotteries[0];
}

/**
 * Cor oficial da bola conforme o dígito da unidade da dezena (Quina e Mega-Sena).
 * Ordem de exibição: 1..9 e 0 (Branca por último), como nas tabelas oficiais.
 */
export type BallColor = {
  digit: number;
  name: string;
  /** Classes da bola (borda + fundo + texto). */
  ball: string;
  /** Pequeno ponto sólido da cor. */
  dot: string;
  /** Fundo suave para destacar a coluna/seção. */
  soft: string;
};

export const colors: BallColor[] = [
  { digit: 1, name: "Vermelha", ball: "border-red-700 bg-red-600 text-white", dot: "bg-red-600", soft: "bg-red-50 dark:bg-red-950/40" },
  { digit: 2, name: "Amarela", ball: "border-yellow-500 bg-yellow-400 text-zinc-900", dot: "bg-yellow-400", soft: "bg-yellow-50 dark:bg-yellow-950/40" },
  { digit: 3, name: "Verde", ball: "border-green-700 bg-green-600 text-white", dot: "bg-green-600", soft: "bg-green-50 dark:bg-green-950/40" },
  { digit: 4, name: "Marrom", ball: "border-amber-900 bg-amber-800 text-white", dot: "bg-amber-800", soft: "bg-amber-50 dark:bg-amber-950/40" },
  { digit: 5, name: "Azul", ball: "border-blue-700 bg-blue-600 text-white", dot: "bg-blue-600", soft: "bg-blue-50 dark:bg-blue-950/40" },
  { digit: 6, name: "Rosa", ball: "border-pink-600 bg-pink-500 text-white", dot: "bg-pink-500", soft: "bg-pink-50 dark:bg-pink-950/40" },
  { digit: 7, name: "Preta", ball: "border-zinc-700 bg-zinc-900 text-white", dot: "bg-zinc-900", soft: "bg-zinc-100 dark:bg-zinc-800/60" },
  { digit: 8, name: "Cinza", ball: "border-gray-600 bg-gray-500 text-white", dot: "bg-gray-500", soft: "bg-gray-50 dark:bg-gray-800/40" },
  { digit: 9, name: "Laranja", ball: "border-orange-600 bg-orange-500 text-white", dot: "bg-orange-500", soft: "bg-orange-50 dark:bg-orange-950/40" },
  { digit: 0, name: "Branca", ball: "border-zinc-400 bg-white text-zinc-900", dot: "bg-white border border-zinc-400", soft: "bg-zinc-50 dark:bg-zinc-900/60" },
];

const colorByDigit = new Map(colors.map((color) => [color.digit, color]));

export function colorOf(dezena: number): BallColor {
  return colorByDigit.get(dezena % 10) ?? colors[colors.length - 1];
}

export function ballColorClass(dezena: number): string {
  return colorOf(dezena).ball;
}

/** Dezenas de uma cor dentro do range da modalidade (ex.: vermelha → 01,11,21...). */
export function dezenasDaCor(color: BallColor, range: number): number[] {
  const result: number[] = [];
  for (let n = 1; n <= range; n += 1) {
    if (n % 10 === color.digit) result.push(n);
  }
  return result;
}

export function drawStats(dezenas: number[]) {
  let even = 0;
  let sum = 0;

  for (const dezena of dezenas) {
    if (dezena % 2 === 0) even += 1;
    sum += dezena;
  }

  return { even, odd: dezenas.length - even, sum };
}

/** Quantidade de bolas de cada cor em um sorteio, na ordem de `colors`. */
export function countByColor(dezenas: number[]): number[] {
  const counts = new Array(10).fill(0);
  for (const dezena of dezenas) counts[dezena % 10] += 1;
  return colors.map((color) => counts[color.digit]);
}

export type ColorDistribution = {
  color: BallColor;
  /** rows[q] = quantas vezes saíram `q` bolas dessa cor num sorteio. */
  rows: { quantidade: number; vezes: number; pct: number }[];
};

/**
 * Para cada cor, distribui quantos sorteios tiveram 0, 1, 2... bolas daquela cor.
 * Percorre todos os sorteios uma única vez.
 */
export function colorDistributions(draws: Draw[], picks: number): ColorDistribution[] {
  const matrix = colors.map(() => new Array(picks + 1).fill(0));

  for (const draw of draws) {
    const per = new Array(10).fill(0);
    for (const dezena of draw.dezenas) per[dezena % 10] += 1;
    colors.forEach((color, index) => {
      matrix[index][per[color.digit]] += 1;
    });
  }

  const total = draws.length || 1;

  return colors.map((color, index) => {
    const series = matrix[index];
    let maxQ = 0;
    series.forEach((vezes, q) => {
      if (vezes > 0) maxQ = q;
    });

    const rows = [];
    for (let q = 0; q <= maxQ; q += 1) {
      rows.push({ quantidade: q, vezes: series[q], pct: (series[q] / total) * 100 });
    }

    return { color, rows };
  });
}

export async function fetchDraws(lottery: Lottery): Promise<Draw[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${lottery.file}`);

  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${lottery.label} (${response.status}).`);
  }

  return (await response.json()) as Draw[];
}
