import { type Agent } from ".prisma/client";
import { cn, convertBytes } from "~/lib/utils";
import Link from "next/link";
import { type AgentInfo } from "~/lib/types/agent";

interface AgentListProps {
  title: string;
  agents: Agent[];
  agentId: string;
}

export default function AgentList({ title, agents, agentId }: AgentListProps) {
  const Hardware = ({ agent }: { agent: Agent }) => {
    const cpu = (agent.info as unknown as AgentInfo).cpu;
    const memory = (agent.info as unknown as AgentInfo).memory;
    return (
      <div className="flex justify-between">
        <p className="line-clamp-2 max-h-10 text-xs text-muted-foreground">
          {agent.description}
        </p>
        <p className="h-7 min-w-[85px] overflow-hidden rounded border p-1 text-xs">
          {cpu?.cores ?? 0} core,{" "}
          {convertBytes(memory?.total ?? 0, "Bytes", "Gigabytes")} GB
        </p>
      </div>
    );
  };

  return (
    <div className="mb-3.5">
      <div className="py-4">
        <span className="mr-3 text-lg">{title}</span>
        <span className="text-xl text-gray-500">{agents.length}</span>
      </div>
      {agents.map((agent, index) => (
        <Link
          href={`/agent/${agent.id}/${
            agent.status === "UNKNOWN" ? "install" : "status"
          }`}
          passHref
          key={index}
        >
          <div
            className={cn(
              "min-h-[5.5rem] cursor-pointer border-b p-4 hover:bg-accent",
              agent.id === agentId && "bg-muted",
            )}
          >
            <p>{agent.name}</p>
            <Hardware agent={agent} />
          </div>
        </Link>
      ))}
    </div>
  );
}
