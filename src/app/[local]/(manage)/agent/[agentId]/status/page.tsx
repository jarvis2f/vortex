import { getPlatformIcon } from "~/lib/icons";
import CpuUsage, {
  type CpuStat,
} from "~/app/[local]/(manage)/agent/_components/cpu-usage";
import MemUsage, {
  type MemStat,
} from "~/app/[local]/(manage)/agent/_components/mem-usage";
import BandwidthUsage, {
  type BandwidthStat,
} from "~/app/[local]/(manage)/agent/_components/bandwidth-usage";
import TrafficUsage, {
  type TrafficStat,
} from "~/app/[local]/(manage)/agent/_components/traffic-usage";
import { convertBytes, convertBytesToBestUnit, formatDate } from "~/lib/utils";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import ID from "~/app/[local]/_components/id";
import { MoveDownIcon, MoveUpIcon } from "lucide-react";
import { api } from "~/trpc/server";
import AgentPrice from "~/app/[local]/(manage)/agent/_components/agent-price";

export const metadata = {
  title: "服务器 - 状态 - vortex",
};

export default async function AgentStat({
  params: { agentId },
}: {
  params: { agentId: string };
}) {
  const agent = await api.agent.stats.query({ id: agentId });
  if (!agent) {
    return null;
  }

  const cpuStats: CpuStat[] = [];
  const memStats: MemStat[] = [];
  const bandwidthStats: BandwidthStat[] = [];
  const [totalDownload, totalDownloadUnit] = convertBytesToBestUnit(
    agent.info.network?.totalDownload ?? 0,
  );
  const [totalUpload, totalUploadUnit] = convertBytesToBestUnit(
    agent.info.network?.totalUpload ?? 0,
  );
  const trafficStat: TrafficStat = {
    download: totalDownload,
    downloadUnit: totalDownloadUnit,
    upload: totalUpload,
    uploadUnit: totalUploadUnit,
  };
  const memTotal = convertBytes(
    agent.info.memory?.total ?? 0,
    "Bytes",
    "Gigabytes",
  );
  const [latestDownload, latestDownloadUnit] = convertBytesToBestUnit(
    agent.stats[agent.stats.length - 1]?.network.downloadSpeed ?? 0,
  );
  const [latestUpload, latestUploadUnit] = convertBytesToBestUnit(
    agent.stats[agent.stats.length - 1]?.network.uploadSpeed ?? 0,
  );

  for (const stat of agent.stats) {
    const time = formatDate(stat.time);
    cpuStats.push({
      date: time,
      percent: Number(stat.cpu.percent.toFixed(2)),
    });
    memStats.push({
      date: time,
      percent: Math.round((stat.memory.used / agent.info.memory?.total) * 100),
      used: convertBytes(stat.memory.used, "Bytes", "Gigabytes"),
    });
    bandwidthStats.push({
      date: time,
      download: stat.network.downloadSpeed,
      upload: -stat.network.uploadSpeed,
    });
  }

  return (
    <div className="mt-0 flex flex-grow flex-col">
      <div className="flex h-2/5 border-b">
        <div className="flex w-1/4 flex-col border-r p-4">
          <p className="text-lg">信息</p>
          <p>{agent.name}</p>
          <p className="line-clamp-4 py-2 text-xs text-muted-foreground">
            {agent.description}
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 flex flex-col space-y-1 text-muted-foreground">
              <span className="text-sm">ID</span>
              <span className="text-sm">系统</span>
              <span className="text-sm">CPU</span>
              <span className="text-sm">内存</span>
              <span className="text-sm">IP地址</span>
              <span className="text-sm">节点版本</span>
              <span className="text-sm">上次响应</span>
              <span className="text-sm">价格</span>
            </div>
            <div className="col-span-2 flex flex-col space-y-1">
              <ID id={agent.id} />
              <span className="flex items-center gap-1 text-sm">
                {getPlatformIcon(agent.info.platform)}{" "}
                {agent.info.platform ?? "未知"}
              </span>
              <span className="line-clamp-1 text-sm">
                {agent.info.cpu?.model} {agent.info.cpu?.cores ?? 0} Core
              </span>
              <span className="text-sm">{memTotal} GB</span>
              <span className="text-sm">
                {agent.info.ip?.country && (
                  <span
                    className={`fi mr-1 fi-${agent.info.ip?.country.toLocaleLowerCase()}`}
                  ></span>
                )}
                {agent.info.ip?.ipv4 ?? 0}
              </span>
              <span className="w-fit bg-accent px-1 text-sm">
                {agent.info.version ?? "UNKNOWN"}
              </span>
              <span className="text-sm">
                {agent.lastReport && formatDate(agent.lastReport)}
              </span>
              <AgentPrice agentId={agentId} />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col border-b px-4 pt-4">
            <div className="flex justify-between">
              <p className="text-lg">CPU</p>
              <div className="text-sm text-gray-500">
                {cpuStats[cpuStats.length - 1]?.percent}%
              </div>
            </div>
            <div className="mt-4 flex-grow">
              <CpuUsage data={cpuStats} />
            </div>
          </div>
          <div className="flex flex-1 flex-col px-4 pt-4">
            <div className="flex justify-between">
              <p className="text-lg">内存</p>
              <div className="text-sm text-gray-500">
                {memStats[memStats.length - 1]?.used ?? 0} GB / {memTotal} GB
              </div>
            </div>
            <div className="mt-4 flex-grow">
              <MemUsage data={memStats} />
            </div>
          </div>
        </div>
      </div>
      <div className="grid flex-grow grid-cols-3">
        <div className="col-span-2 flex flex-col border-r px-4 pt-4">
          <div className="flex justify-between">
            <p className="text-lg">带宽</p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center">
                <MoveDownIcon className="mr-1 inline-block h-4 w-4" />
                {latestDownload} {latestDownloadUnit}
              </span>
              <span className="flex items-center">
                <MoveUpIcon className="mr-1 inline-block h-4 w-4" />
                {latestUpload} {latestUploadUnit}
              </span>
            </div>
          </div>
          <div className="flex-grow">
            <BandwidthUsage data={bandwidthStats} />
          </div>
        </div>
        <div className="col-span-1 flex flex-col  px-4 pt-4">
          <div className="flex justify-between">
            <p className="text-lg">流量</p>
          </div>
          <div className="mt-10 flex-grow">
            <TrafficUsage stat={trafficStat} />
          </div>
        </div>
      </div>
    </div>
  );
}
