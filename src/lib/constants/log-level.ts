export const GO_LEVEL_2_PINO_LEVEL: Record<string, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  panic: 60,
} as const;

export const GO_LEVELS = [
  {
    label: "Debug",
    value: "debug",
  },
  {
    label: "Info",
    value: "info",
  },
  {
    label: "Warn",
    value: "warn",
  },
  {
    label: "Error",
    value: "error",
  },
  {
    label: "Fatal",
    value: "fatal",
  },
  {
    label: "PANIC",
    value: "panic",
  },
];

export const LEVELS = [
  {
    label: "Trace",
    value: "10",
    color: "text-gray-500",
  },
  {
    label: "Debug",
    value: "20",
    color: "text-blue-500",
  },
  {
    label: "Info",
    value: "30",
    color: "text-green-500",
  },
  {
    label: "Warn",
    value: "40",
    color: "text-yellow-500",
  },
  {
    label: "Error",
    value: "50",
    color: "text-red-500",
  },
  {
    label: "Fatal",
    value: "60",
    color: "text-red-500",
  },
];

export function getLevel(level: string) {
  return LEVELS.find((l) => l.value === level);
}
