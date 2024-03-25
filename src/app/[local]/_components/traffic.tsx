import { convertBytesToBestUnit } from "~/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/lib/ui/hover-card";
import { MoveDownIcon, MoveUpIcon } from "lucide-react";
import TrafficUsageMonth from "~/app/[local]/_components/traffic-usage-month";
import { type ForwardTrafficDimensions } from "~/lib/types";

interface TrafficProps {
  upload: number;
  download: number;
  relationId: string;
  dimensions?: ForwardTrafficDimensions;
}

export default function Traffic({
  upload,
  download,
  relationId,
  dimensions,
}: TrafficProps) {
  const uploadWithUnit = convertBytesToBestUnit(upload);
  const downloadWithUnit = convertBytesToBestUnit(download);
  const totalWithUnit = convertBytesToBestUnit(upload + download);

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild={true}>
        <span className="inline-block min-w-16 cursor-pointer rounded bg-accent px-2 text-center">
          {totalWithUnit[0]} {totalWithUnit[1]}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="min-h-[26rem] min-w-[26rem]">
        <div className="flex min-w-[6rem] justify-around">
          <div className="flex items-center gap-1">
            <MoveUpIcon className="inline-block h-4 w-4" />
            <span className="text-primary/50">
              {uploadWithUnit[0]} {uploadWithUnit[1]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MoveDownIcon className="inline-block h-4 w-4" />
            <span className="text-primary/50">
              {downloadWithUnit[0]} {downloadWithUnit[1]}
            </span>
          </div>
        </div>
        <TrafficUsageMonth relationId={relationId} dimensions={dimensions} />
      </HoverCardContent>
    </HoverCard>
  );
}
