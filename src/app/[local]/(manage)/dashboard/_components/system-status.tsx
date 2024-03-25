"use client";
import { api } from "~/trpc/react";
import { Label } from "~/lib/ui/label";
import { Progress } from "~/lib/ui/progress";
import { convertBytesToBestUnit } from "~/lib/utils";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { MoveDownIcon, MoveUpIcon } from "lucide-react";
import type { TooltipProps } from "recharts/types/component/Tooltip";
import { useTranslations } from "use-intl";

export default function SystemStatus() {
  const t = useTranslations("dashboard-system-status");
  const [networks, setNetworks] = useState<
    {
      upload: number;
      download: number;
    }[]
  >(() => {
    return new Array(10).fill({ upload: 0, download: 0 });
  });

  const { data } = api.system.getSystemStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data) {
      setNetworks((networks) => {
        networks.push({
          upload: data.network.upload ?? 0,
          download: data.network.download ?? 0,
        });

        if (networks.length > 10) {
          networks.shift();
        }
        return networks;
      });
    }
  }, [data]);

  const [upload, uploadUnit] = convertBytesToBestUnit(
    data?.network.upload ?? 0,
  );
  const [download, downloadUnit] = convertBytesToBestUnit(
    data?.network.download ?? 0,
  );

  const tooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload?.length) {
      const [download, downloadUnit] = convertBytesToBestUnit(
        payload[0]?.value ?? 0,
      );
      const [upload, uploadUnit] = convertBytesToBestUnit(
        payload[1]?.value ?? 0,
      );
      return (
        <div className="rounded-md bg-white p-4 shadow-md dark:bg-accent">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{t("download")}</span>
              <span className="text-sm">{t("upload")}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{`${download} ${downloadUnit}`}</span>
              <span className="text-sm">{`${Number(
                upload,
              )} ${uploadUnit}`}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 lg:flex-row lg:p-4">
      <div className="space-y-4 lg:w-[200px]">
        <div className="flex flex-col space-y-2">
          <Label className="block">CPU</Label>
          <div className="flex items-center space-x-2">
            <Progress value={data?.load} />
            <span className="text-sm">{data?.load.toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <Label className="block">{t("memory")}</Label>
          <div className="flex items-center space-x-2">
            <Progress value={data?.mem} />
            <span className="text-sm">{data?.mem.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1">
        <div className="relative flex w-full items-center justify-center gap-1">
          <Label className="absolute left-0">{t("network")}</Label>
          <div className="before:content flex items-center before:h-2 before:w-2 before:bg-[#fef08a]">
            <MoveDownIcon className="h-3 w-3" />
            <span className="text-sm">
              {download} {downloadUnit}
            </span>
          </div>
          <div className="before:content ml-3 flex items-center before:h-2 before:w-2 before:bg-[#38bdf8]">
            <MoveUpIcon className="h-3 w-3" />
            <span className="text-sm">
              {upload} {uploadUnit}
            </span>
          </div>
        </div>
        <ResponsiveContainer width="80%" height="80%">
          <LineChart
            width={300}
            height={100}
            data={networks}
            key={`rc_${networks[0]?.upload}_${networks[0]?.download}`}
          >
            <Tooltip<number, string> content={tooltip} />
            <Line
              dataKey="download"
              stroke="#fef08a"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="upload"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
