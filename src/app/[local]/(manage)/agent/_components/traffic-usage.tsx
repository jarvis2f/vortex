"use client";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { TooltipProps } from "recharts/types/component/Tooltip";

export interface TrafficStat {
  download: number;
  downloadUnit: string;
  upload: number;
  uploadUnit: string;
}

export default function TrafficUsage({ stat }: { stat: TrafficStat }) {
  const data = [
    {
      type: "下载",
      traffic: stat.download,
    },
    {
      type: "上传",
      traffic: stat.upload,
    },
  ];

  const tooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      const unit = label == "下载" ? stat.downloadUnit : stat.uploadUnit;
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <p className="mb-2">{`${label} ${payload[0]!.value} ${unit}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="80%">
      <BarChart data={data} barCategoryGap="30%" height={300}>
        <XAxis
          dataKey="type"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />

        <defs>
          <linearGradient id="trafficUsageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>

        <Tooltip<number, string> content={tooltip} />
        <Bar
          dataKey="traffic"
          fill="url(#trafficUsageGradient)"
          className="bg-gradient-to-t from-indigo-500"
        >
          <LabelList
            dataKey="traffic"
            position="insideTop"
            className="fill-white"
            formatter={(v: number, i: number) => {
              return `${v} ${
                data[i]?.type == "下载" ? stat.downloadUnit : stat.uploadUnit
              }`;
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
