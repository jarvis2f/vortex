"use client";
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { type TooltipProps } from "recharts/types/component/Tooltip";
import { convertBytesToBestUnit } from "~/lib/utils";

export interface BandwidthStat {
  date: string;
  download: number;
  upload: number;
}

export default function BandwidthUsage({ data }: { data: BandwidthStat[] }) {
  const legendFormatter = (value: string) => {
    return value === "download" ? "下载" : "上传";
  };

  const tooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      const [download, downloadUnit] = convertBytesToBestUnit(
        payload[0]?.value ?? 0,
      );
      const [upload, uploadUnit] = convertBytesToBestUnit(
        -(payload[1]?.value ?? 0),
      );
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <p className="mb-2">{`${label}`}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm">下载</span>
              <span className="text-sm">上传</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{`${download} ${downloadUnit}`}</span>
              <span className="text-sm">{`${upload} ${uploadUnit}`}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="80%">
      <AreaChart data={data} height={200}>
        <defs>
          <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c084fc" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5eead4" stopOpacity={0} />
            <stop offset="95%" stopColor="#5eead4" stopOpacity={1} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" display="none" />
        <Tooltip<number, string> content={tooltip} />
        <Legend verticalAlign="top" height={36} formatter={legendFormatter} />
        <Area
          type="monotone"
          dataKey="download"
          stroke="#c084fc"
          strokeWidth={2}
          fill="url(#colorDownload)"
        />
        <Area
          type="monotone"
          dataKey="upload"
          stroke="#5eead4"
          strokeWidth={2}
          fill="url(#colorUpload)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
