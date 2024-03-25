"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import { Button } from "~/lib/ui/button";
import { TerminalSquareIcon, XIcon } from "lucide-react";
import { Textarea } from "~/lib/ui/textarea";
import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { type AgentTaskType } from "~/lib/types/agent";
import { AgentTaskTypeOptions } from "~/lib/constants";
import { isBase64 } from "~/lib/utils";
import { useTrack } from "~/lib/hooks/use-track";

export default function AgentCommand({
  currentAgentId,
}: {
  currentAgentId: string;
}) {
  const [command, setCommand] = useState("");
  const [type, setType] = useState<AgentTaskType>("shell");
  const [open, setOpen] = useState(false);
  const executeCommandMutation = api.agent.executeCommand.useMutation();
  const { track } = useTrack();

  function executeCommand() {
    track("agent-execute-command-button", {
      agentId: currentAgentId,
      command: command,
      type: type,
    });
    void executeCommandMutation.mutateAsync({
      id: currentAgentId,
      command: command,
      type: type,
    });
  }

  const RenderCommandResult = () => {
    const error = executeCommandMutation.error;
    if (executeCommandMutation.isError) {
      return (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            执行结果：<span>失败</span>
          </p>
          <code className="whitespace-pre text-sm text-muted-foreground">
            <span>{error?.message}</span>
          </code>
        </div>
      );
    }
    if (!executeCommandMutation.data) {
      return null;
    }
    const extra = executeCommandMutation.data.extra;
    const result = extra ? (isBase64(extra) ? atob(extra) : String(extra)) : "";
    return (
      <div className="mt-2">
        <p className="text-sm text-muted-foreground">
          执行结果：
          <span>{executeCommandMutation.data.success ? "成功" : "失败"}</span>
        </p>
        <pre className="max-h-[20rem] overflow-scroll whitespace-pre text-sm text-muted-foreground">
          {result}
        </pre>
      </div>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          <TerminalSquareIcon className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex justify-between">
            <span>执行命令</span>
            <Button
              variant="ghost"
              className="ml-2"
              onClick={() => setOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="overflow-hidden">
          <Select
            onValueChange={(value) => setType(value as AgentTaskType)}
            value={type}
          >
            <SelectTrigger className="mb-3 w-[8rem]">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              {AgentTaskTypeOptions?.map((option, index) => (
                <SelectItem value={option.value} key={index}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {type === "shell" && (
            <Textarea
              className="w-full"
              rows={5}
              placeholder="请输入命令"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          )}
          <RenderCommandResult />
        </div>
        <AlertDialogFooter>
          <Button
            onClick={executeCommand}
            disabled={type === "shell" && command === ""}
            loading={executeCommandMutation.isLoading}
            success={executeCommandMutation.isSuccess}
          >
            执行
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
