"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts/types/component/Tooltip";
import { convertBytesToBestUnit } from "~/lib/utils";
import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslations } from "use-intl";

export default function UserTrafficUsage() {
  const t = useTranslations("dashboard-traffic-usage");
  const startDate = dayjs().subtract(7, "day").startOf("day").toDate();
  const endDate = dayjs().endOf("day").toDate();

  const { data } = api.forward.trafficUsage.useQuery({
    startDate: startDate,
    endDate: endDate,
    dimensions: "user",
  });

  const trafficUsage = useMemo(() => {
    if (!data) return [];
    return data.map((item) => {
      return {
        date: item.date,
        traffic: item.download + item.upload,
      };
    });
  }, [data]);

  const tooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      const [traffic, trafficUnit] = convertBytesToBestUnit(
        payload[0]?.value ?? 0,
      );
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <p className="mb-2">{`${payload[0]?.payload.date}`}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{t("used_traffic")}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{`${traffic} ${trafficUnit}`}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="80%" height="70%">
      <LineChart width={300} height={100} data={trafficUsage}>
        <Tooltip<number, string> content={tooltip} />
        <Line
          type="monotone"
          dataKey="traffic"
          stroke="#8884d8"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
