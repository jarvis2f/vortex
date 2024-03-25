import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { api } from "~/trpc/react";
import { ByteUnitsShort, convertBytes, findBestByteUnit } from "~/lib/utils";
import type { TooltipProps } from "recharts/types/component/Tooltip";
import dayjs from "dayjs";
import { type ForwardTrafficDimensions } from "~/lib/types";

const month = {
  "1": "一月",
  "2": "二月",
  "3": "三月",
  "4": "四月",
  "5": "五月",
  "6": "六月",
  "7": "七月",
  "8": "八月",
  "9": "九月",
  "10": "十月",
  "11": "十一月",
  "12": "十二月",
};

export default function TrafficUsageMonth({
  relationId,
  dimensions,
}: {
  relationId: string;
  dimensions?: ForwardTrafficDimensions;
}) {
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth() + 1,
  );

  const { data } = api.forward.trafficUsage.useQuery({
    id: relationId,
    month: currentMonth,
    dimensions,
  });

  const byteUnit = useMemo(() => {
    if (data) {
      const speeds: number[] = data.map((stat) => stat.download);
      speeds.push(...data.map((stat) => stat.upload));
      return findBestByteUnit(speeds);
    }
  }, [data]);

  const unit = useMemo(() => {
    if (byteUnit) {
      return ByteUnitsShort[byteUnit];
    }
  }, [byteUnit]);

  const dataWithUnit = useMemo(() => {
    if (data && byteUnit) {
      return data.map((stat) => {
        return {
          date: stat.date,
          upload: convertBytes(stat.upload, "Bytes", byteUnit),
          download: convertBytes(stat.download, "Bytes", byteUnit),
        };
      });
    }
  }, [data, byteUnit]);

  function changeMonth(plus: boolean) {
    let newMonth = currentMonth;
    if (plus) {
      newMonth++;
    } else {
      newMonth--;
    }
    if (newMonth < 1) {
      newMonth = 12;
    }
    if (newMonth > 12) {
      newMonth = 1;
    }
    setCurrentMonth(newMonth);
  }

  const tooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <p className="mb-2">{`${label}`}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm">上传</span>
              <span className="text-sm">下载</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{`${payload[0]!.value} ${unit}`}</span>
              <span className="text-sm">{`${Number(
                payload[1]!.value,
              )} ${unit}`}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const legendFormatter = (value: string) => {
    return value === "download" ? "下载" : "上传";
  };

  return (
    <div className="mt-2 h-full w-full">
      <div className="mt-[14px] flex w-[150px] items-center justify-between">
        <div className="cursor-pointer" onClick={() => changeMonth(false)}>
          <ChevronLeftIcon className="h-5 w-5" />
        </div>
        <div className="mx-[10px] font-bold">
          {month[String(currentMonth) as keyof typeof month]}
        </div>
        <div className="cursor-pointer" onClick={() => changeMonth(true)}>
          <ChevronRightIcon className="h-5 w-5" />
        </div>
      </div>
      <div className="wrap mt-[20px] flex h-[20rem] w-full gap-[20px]">
        <ResponsiveContainer>
          <BarChart data={dataWithUnit}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fillOpacity: 0.7 }}
              axisLine={false}
              tickLine={{ strokeOpacity: 0.3, height: 5 }}
              tickSize={10}
              tickFormatter={(value, _) => {
                return dayjs(value as string).format("DD");
              }}
            />
            <Tooltip<number, string> content={tooltip} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={legendFormatter}
            />
            <Bar dataKey="upload" stackId="a" fill="rgb(52 211 153 / 0.7)" />
            <Bar dataKey="download" stackId="a" fill="rgb(124 58 237 / 0.7)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
