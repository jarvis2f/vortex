import { Popover, PopoverContent, PopoverTrigger } from "~/lib/ui/popover";
import { Button, buttonVariants } from "~/lib/ui/button";
import { AlarmClockIcon } from "lucide-react";
import { Label } from "~/lib/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { useContext, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { useStore } from "zustand";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";
import { cn, isBase64, isJson } from "~/lib/utils";
import { type NetworkExternalNode } from "~/lib/types/agent";
import { useTrack } from "~/lib/hooks/use-track";

const networkTestOptions = [
  { label: "Ping测试", value: "ping" },
  { label: "iperf3测试", value: "iperf3", disabled: true },
];

export default function AgentEdgeTest({ edgeId: id }: { edgeId: string }) {
  const { findNode, findEdge, checkIsForward2Agent } = useStore(
    useContext(NetworkContext)!,
  );
  const agentPingMutation = api.agent.ping.useMutation();
  const agentIperf3Mutation = api.agent.iperf3.useMutation();
  const [networkTestType, setNetworkTestType] = useState("");
  const { track } = useTrack();

  const isForward2Agent = useMemo(() => {
    return checkIsForward2Agent(id);
  }, [id]);

  const RenderError = (message: string) => {
    return (
      <div className="mt-2 w-full">
        <p className="text-sm text-muted-foreground">
          执行结果：<span>失败</span>
        </p>
        <code className="whitespace-pre-wrap text-sm text-muted-foreground">
          <span>{message}</span>
        </code>
      </div>
    );
  };

  const RenderPingResult = () => {
    const error = agentPingMutation.error;
    if (agentPingMutation.isError) {
      return RenderError(error?.message ?? "");
    }
    if (!agentPingMutation.data) {
      return null;
    }
    const extra = agentPingMutation.data.extra ?? "";
    let result: any = isBase64(extra) ? atob(extra) : extra;
    if (!isJson(result as string)) {
      return RenderError(result as string);
    } else {
      result = JSON.parse(result as string);
    }
    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-sm text-muted-foreground">最小延迟</p>
          <p className="text-sm text-muted-foreground">
            {(result.MinRtt / 1000000).toFixed(3)} ms
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">最大延迟</p>
          <p className="text-sm text-muted-foreground">
            {(result.MaxRtt / 1000000).toFixed(3)} ms
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">平均延迟</p>
          <p className="text-sm text-muted-foreground">
            {(result.AvgRtt / 1000000).toFixed(3)} ms
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">丢包率</p>
          <p className="text-sm text-muted-foreground">
            {(result.PacketLoss as number).toFixed(3)}%
          </p>
        </div>
      </div>
    );
  };

  const RenderIperf3Result = () => {
    return <div></div>;
  };

  const testTypes = {
    ping: {
      mutation: agentPingMutation,
      render: RenderPingResult,
    },
    iperf3: {
      mutation: agentIperf3Mutation,
      render: RenderIperf3Result,
    },
  };

  function handleTest() {
    if (networkTestType === "") {
      return;
    }
    const edge = findEdge(id);
    let target = edge!.target;
    if (!isForward2Agent) {
      target = (findNode(edge!.target)?.data as NetworkExternalNode).host;
    }
    const targetType = isForward2Agent ? "agent" : "host";
    track("agent-edge-test-button", {
      edgeId: edge!.source,
      target: target,
      targetType: targetType,
    });
    void testTypes[
      networkTestType as keyof typeof testTypes
    ]?.mutation.mutateAsync({
      id: edge!.source,
      target: target,
      targetType: targetType,
    });
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "h-auto p-1")}
      >
        <AlarmClockIcon className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80 max-w-2xl">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">网络诊断</h4>
            <p className="text-sm text-muted-foreground">诊断中转的网络连接</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="测试方式">测试方式</Label>
              <Select
                onValueChange={(v) => setNetworkTestType(v)}
                value={networkTestType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networkTestOptions.map((option) => (
                    <SelectItem
                      value={option.value}
                      key={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={networkTestType === ""}
              loading={
                testTypes[networkTestType as keyof typeof testTypes]?.mutation
                  .isLoading
              }
              success={
                testTypes[networkTestType as keyof typeof testTypes]?.mutation
                  .isSuccess
              }
              onClick={handleTest}
            >
              开始
            </Button>
          </div>
          {testTypes[networkTestType as keyof typeof testTypes]?.render()}
        </div>
      </PopoverContent>
    </Popover>
  );
}
