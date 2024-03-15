"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipProps } from "recharts/types/component/Tooltip";

export interface CpuStat {
  date: string;
  percent: number;
}

export default function CpuUsage({ data }: { data: CpuStat[] }) {
  const tooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <p>{`${label} ${payload[0]!.value}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} height={100}>
        <defs>
          <linearGradient id="cpuUsageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis dataKey="date" display="none" />
        <Tooltip<number, string> content={tooltip} />
        <Area
          type="linear"
          dataKey="percent"
          stroke="#22d3ee"
          fillOpacity={1}
          fill="url(#cpuUsageGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
