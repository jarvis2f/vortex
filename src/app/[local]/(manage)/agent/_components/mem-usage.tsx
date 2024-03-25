"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipProps } from "recharts/types/component/Tooltip";

export interface MemStat {
  date: string;
  percent: number;
  used: number;
}

export default function MemUsage({ data }: { data: MemStat[] }) {
  const tooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <p className="mb-2">{`${label} ${payload[0]!.value}% `}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} height={100}>
        <defs>
          <linearGradient id="memUsageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fde68a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#fde68a" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis dataKey="date" display="none" />
        <Tooltip<number, string> content={tooltip} />
        <Area
          type="linear"
          dataKey="percent"
          stroke="#86efac"
          fillOpacity={1}
          fill="url(#memUsageGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
