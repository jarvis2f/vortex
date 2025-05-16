"use client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/lib/ui/tooltip";

import { BadgeInfoIcon } from "lucide-react";

import { type ReactNode, useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useTrack } from "~/lib/hooks/use-track";
import { Button } from "~/lib/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn, isBase64, isJson } from "~/lib/utils";
import { ForwardMethod } from ".prisma/client";

interface ForwardCheckProps {
  forwardId: string;
  target: string;
  agentPort: number;
  forwardMethod: string;
  targetType: "agent" | "host";
}

interface ICMPResult {
  PacketsRecv: number;
  PacketsSent: number;
  PacketsRecvDuplicates: number;
  PacketsSentDuplicates: number;
  IPAddr: { IP: string; Zone: string };
  Addr: string;
  Rtts: number[]; // nanoseconds
  MinRtt: number;
  MaxRtt: number;
  AvgRtt: number;
  StdDevRtt: number;
}

interface ServiceStatus {
  is_active: boolean;
  details: string;
}

interface PingResult {
  icmp: ICMPResult;
  tcp_rtts_ms: number[]; // milliseconds
  service_status: ServiceStatus;
}

export default function ForwardCheck({
  trigger,
  forward,
}: {
  trigger: ReactNode;
  forward: ForwardCheckProps;
}) {
  const agentPingMutation = api.agent.ping.useMutation();
  const { track } = useTrack();
  const [open, setOpen] = useState(false);
  const [parsedResult, setParsedResult] = useState<PingResult | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // 弹窗打开时自动检测
  useEffect(() => {
    if (open) {
      setParsedResult(null);
      setStatus("loading");
      setErrorMessage("");

      track("check-forward-button", { forward });

      agentPingMutation
        .mutateAsync({
          id: forward.forwardId,
          target: forward.target,
          agentPort: forward.agentPort,
          forwardMethod: forward.forwardMethod as ForwardMethod,
          targetType: forward.targetType,
        })
        .then((res) => {
          const extra = res.extra ?? "";
          const result = isBase64(extra) ? atob(extra) : extra;

          if (!isJson(result)) {
            setStatus("error");
            setErrorMessage(typeof result === "string" ? result : "未知错误");
          } else {
            try {
              const parsedData = JSON.parse(result) as PingResult;
              setParsedResult(parsedData);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setErrorMessage("解析结果失败");
            }
          }
        })
        .catch((e: Error) => {
          setStatus("error");
          setErrorMessage(e?.message ?? "检测失败");
        });
    }
  }, [open, forward.forwardId, forward.target, forward.targetType]);

  const renderPingResult = () => {
    if (status === "loading") {
      return (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          检测中...
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="my-4 flex flex-col items-center justify-center">
          <div className="mb-2 flex items-center text-destructive">
            <XCircle className="mr-2 h-5 w-5" />
            <span>检测失败</span>
          </div>
          <code className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {errorMessage}
          </code>
        </div>
      );
    }

    if (status === "success" && parsedResult) {
      const { icmp, tcp_rtts_ms, service_status } = parsedResult;
      const loss =
        ((icmp.PacketsSent - icmp.PacketsRecv) / icmp.PacketsSent) * 100;

      const tcpAvg =
        tcp_rtts_ms.length > 0
          ? (
              tcp_rtts_ms.reduce((a, b) => a + b, 0) / tcp_rtts_ms.length
            ).toFixed(3)
          : "-";
      const renderServiceStatus = () => {
        return (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <BadgeInfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent align="center">
                {service_status.details}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      };

      return (
        <div className="my-4">
          <div className="mb-3 flex items-center justify-center text-green-600">
            <CheckCircle2 className="mr-2 h-5 w-5" />
            <span>检测成功</span>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-md bg-muted/50 p-4">
            <div>
              <p className="text-sm font-medium">最小延迟</p>
              <p className="text-lg font-semibold text-primary">
                {(icmp.MinRtt / 1000000).toFixed(3)} ms
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">最大延迟</p>
              <p className="text-lg font-semibold text-primary">
                {(icmp.MaxRtt / 1000000).toFixed(3)} ms
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">平均延迟</p>
              <p className="text-lg font-semibold text-primary">
                {(icmp.AvgRtt / 1000000).toFixed(3)} ms
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">丢包率</p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  Number(loss) === 0
                    ? "text-green-600"
                    : Number(loss) < 5
                      ? "text-amber-500"
                      : "text-destructive",
                )}
              >
                {loss.toFixed(3)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">服务状态</p>
              <p className="text-lg font-semibold text-primary">
                {service_status.is_active ? (
                  <span className="flex min-w-16 max-w-20 items-center text-green-600">
                    正常
                    {renderServiceStatus()}
                  </span>
                ) : (
                  <span className="text-red-600">错误</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">TCP Ping</p>
              <p className="text-lg font-semibold text-primary">{tcpAvg} ms</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // 处理重新测试的逻辑
  const handleRetryTest = () => {
    setStatus("loading");
    setParsedResult(null);
    track("check-forward-retry-button", { forward });

    agentPingMutation
      .mutateAsync({
        id: forward.forwardId,
        target: forward.target,
        agentPort: forward.agentPort,
        forwardMethod: forward.forwardMethod as ForwardMethod,
        targetType: forward.targetType,
      })
      .then((res) => {
        const extra = res.extra ?? "";
        const result = isBase64(extra) ? atob(extra) : extra;

        if (!isJson(result)) {
          setStatus("error");
          setErrorMessage(typeof result === "string" ? result : "未知错误");
        } else {
          try {
            const parsedData = JSON.parse(result) as PingResult;
            setParsedResult(parsedData);
            setStatus("success");
          } catch (err) {
            setStatus("error");
            setErrorMessage("解析结果失败");
          }
        }
      })
      .catch((e: Error) => {
        setStatus("error");
        setErrorMessage(e?.message ?? "检测失败");
      });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>检测转发</AlertDialogTitle>
          <AlertDialogDescription>
            检测该转发是否可用，不会影响流量统计。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {renderPingResult()}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={status === "loading"}>
            关闭
          </AlertDialogCancel>
          {status !== "loading" && (
            <Button variant="default" onClick={handleRetryTest}>
              重新测试
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
