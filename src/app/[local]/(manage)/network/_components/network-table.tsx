"use client";
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "~/lib/ui/input";
import { type ChangeEvent, useMemo, useState } from "react";
import Table from "~/app/[local]/_components/table";
import { api } from "~/trpc/react";
import { type NetworkGetAllOutput } from "~/lib/types/trpc";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import NetworkDelete from "~/app/[local]/(manage)/network/_components/network-delete";
import { Button } from "~/lib/ui/button";
import { ArrowRightIcon, CopyIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { copyToClipboard } from "~/lib/utils";
import { type AgentInfo, type NetworkFlow } from "~/lib/types/agent";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import Traffic from "~/app/[local]/_components/traffic";
import { ForwardTrafficDimensions } from "~/lib/constants";

export default function NetworkTable({ keyword: k }: { keyword: string }) {
  const [keyword, setKeyword] = useState(k);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const isFiltered = useMemo(() => keyword && keyword !== "", [keyword]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const networks = api.network.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
  });

  const columns: ColumnDef<NetworkGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return <ID id={row.original.id} createdAt={row.original.createdAt} />;
      },
    },
    {
      accessorKey: "name",
      header: "名称",
      cell: ({ row }) => {
        return (
          <Link
            href={`/network/${row.original.id}`}
            className="hover:underline"
          >
            <div className="flex flex-col gap-1">
              <p>{row.original.name}</p>
            </div>
          </Link>
        );
      },
    },
    {
      id: "nodeInfo",
      header: "节点信息",
      cell: ({ row }) => {
        const edges = row.original.edges;
        if (!edges || edges.length === 0) {
          return null;
        }
        if (edges.length === 1) {
          const sourceForward = edges[0]!.sourceForward;
          return (
            <div className="flex items-center gap-1">
              <span className="bg-accent px-1">
                {sourceForward?.agent.name}:{sourceForward?.agentPort ?? 0}
              </span>
              <ArrowRightIcon className="h-4 w-4" />
              <span className="bg-accent px-1">
                {sourceForward?.target}:{sourceForward?.targetPort ?? 0}
              </span>
            </div>
          );
        }
        const nodeLength = (row.original.flow as unknown as NetworkFlow).nodes
          .length;
        const startForward = edges[edges.length - 1]!.sourceForward;
        const endForward = edges[0]!.sourceForward;
        return (
          <div className="flex items-center gap-1">
            <span className="bg-accent p-1">
              {startForward?.agent.name}:{startForward?.agentPort ?? 0}
            </span>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
            <span className="bg-accent p-1">{nodeLength - 2} 个节点</span>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
            <span className="bg-accent p-1">
              {endForward?.target}:{endForward?.targetPort ?? 0}
            </span>
          </div>
        );
      },
    },
    {
      id: "traffic",
      header: "流量",
      cell: ({ row }) => {
        return (
          <Traffic
            upload={row.original.traffic.upload}
            download={row.original.traffic.download}
            relationId={row.original.id}
            dimensions={ForwardTrafficDimensions.network}
          />
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "创建者",
      cell: ({ row }) => <UserColumn user={row.original.createdBy} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const startForward =
          row.original.edges[row.original.edges.length - 1]?.sourceForward;
        return (
          <div className="flex gap-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="text-sm">
                  <Button
                    disabled={!startForward}
                    variant="ghost"
                    onClick={() => {
                      copyToClipboard(
                        `${(startForward?.agent.info as unknown as AgentInfo)
                          ?.ip.ipv4}:${startForward?.agentPort ?? 0}`,
                      );
                    }}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="flex items-center gap-4">
                复制入口地址
              </TooltipContent>
            </Tooltip>
            <NetworkDelete id={row.original.id} />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: networks.data?.networks ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((networks.data?.total ?? 0) / 10),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="过滤名称"
            value={keyword ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                setKeyword("");
                table.resetColumnFilters();
              }}
              className="h-8 px-2 lg:px-3"
            >
              重置
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/network/new">
            <Button className="h-8 px-2 lg:px-3">创建新的组网</Button>
          </Link>
        </div>
      </div>
      <Table table={table} isLoading={networks.isLoading} />
    </div>
  );
}
