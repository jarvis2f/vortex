"use client";
import { type ChangeEvent, useMemo, useState } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { api } from "~/trpc/react";
import { Input } from "~/lib/ui/input";
import Table from "~/app/[local]/_components/table";
import { type RechargeCodeGetAllOutput } from "~/lib/types/trpc";
import { Button } from "~/lib/ui/button";
import { TicketCheckIcon, TicketIcon, Trash2Icon, XIcon } from "lucide-react";
import { DataTableViewOptions } from "~/app/[local]/_components/table-view-options";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import { Switch } from "~/lib/ui/switch";
import { Label } from "~/lib/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import { Slider } from "~/lib/ui/slider";
import { MoneyInput } from "~/lib/ui/money-input";
import { useTrack } from "~/lib/hooks/use-track";

interface RechargeCodeTableProps {
  page?: number;
  size?: number;
  keyword?: string;
  used?: boolean;
}

export default function RechargeCodeTable({
  page,
  size,
  keyword: initialKeyword,
  used: initialUsed,
}: RechargeCodeTableProps) {
  const [keyword, setKeyword] = useState(initialKeyword ?? "");
  const [used, setUsed] = useState(initialUsed ?? false);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page ?? 0,
    pageSize: size ?? 10,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const rechargeCodes = api.rechargeCode.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
    used: used,
  });

  const columns: ColumnDef<RechargeCodeGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return <ID id={row.original.id} />;
      },
    },
    {
      accessorKey: "code",
      header: "充值码",
      cell: ({ row }) => {
        return <ID id={row.original.code} />;
      },
    },
    {
      accessorKey: "amount",
      header: "金额",
      cell: ({ row }) => {
        return (
          <MoneyInput
            className="text-sm"
            displayType="text"
            value={row.original.amount}
          />
        );
      },
    },
    {
      accessorKey: "used",
      header: "使用状态",
      cell: ({ row }) => {
        return row.original.used ? (
          <TicketCheckIcon className="h-5 w-5 text-green-600" />
        ) : (
          <TicketIcon className="h-5 w-5 text-muted-foreground" />
        );
      },
    },
    {
      accessorKey: "user",
      header: "使用用户",
      cell: ({ row }) =>
        row.original.user && <UserColumn user={row.original.user} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex gap-1">
            {!row.original.used && <RechargeCodeDelete id={row.original.id} />}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: rechargeCodes.data?.rechargeCodes ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((rechargeCodes.data?.total ?? 0) / 10),
    state: {
      pagination,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const isFiltered = useMemo(() => keyword !== "" || used, [keyword, used]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Code/用户ID/金额"
            value={keyword ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="used"
              checked={used}
              onCheckedChange={(checked) => setUsed(checked)}
            />
            <Label className="ml-2" htmlFor="used">
              已使用
            </Label>
          </div>
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                setKeyword("");
                setUsed(false);
                table.resetColumnFilters();
              }}
              className="h-8 px-2 lg:px-3"
            >
              重置
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <RechargeCodeNew />
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <Table table={table} isLoading={rechargeCodes.isLoading} />
    </div>
  );
}

function RechargeCodeDelete({ id }: { id: string }) {
  const deleteMutation = api.rechargeCode.delete.useMutation();
  const utils = api.useUtils();
  const { track } = useTrack();

  const handleDelete = () => {
    track("recharge-code-delete-button", {
      codeId: id,
    });
    void deleteMutation.mutateAsync({ id: id }).then(() => {
      void utils.rechargeCode.getAll.refetch();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          loading={deleteMutation.isLoading}
          success={deleteMutation.isSuccess}
        >
          <Trash2Icon className="h-4 w-4 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你确认要删除这条充值码吗？</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>继续</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RechargeCodeNew() {
  const [amount, setAmount] = useState("0");
  const [num, setNum] = useState(1);
  const [needExport, setNeedExport] = useState(false);
  const { track } = useTrack();

  const createRechargeCodeMutation = api.rechargeCode.create.useMutation({
    onSuccess: (data) => {
      if (needExport) {
        const blob = new Blob([JSON.stringify(data)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "recharge-codes.json";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto hidden h-8 lg:flex">添加</Button>
      </DialogTrigger>
      <DialogContent className="min-w-20">
        <DialogHeader>
          <DialogTitle>创建充值码</DialogTitle>
        </DialogHeader>
        <div className="mb-3">
          <Label>金额</Label>
          <div className="mt-3">
            <MoneyInput
              value={amount}
              onValueChange={(value) => {
                setAmount(value.value);
              }}
            />
          </div>
        </div>
        <div className="mb-3">
          <Label>数量</Label>
          <div className="mt-3">
            <Slider
              className="mb-3"
              value={[num]}
              max={100}
              step={1}
              min={1}
              onValueChange={(value) => setNum(value[0]!)}
            />
            <span className="mt-3 text-xs text-muted-foreground">
              {num} 个，共 {parseFloat(amount) * num} 元
            </span>
          </div>
        </div>
        <DialogFooter>
          <div className="flex items-center gap-3">
            <Label htmlFor="needExport">创建后导出</Label>
            <Switch
              id="needExport"
              onCheckedChange={setNeedExport}
              checked={needExport}
            />
          </div>
          <Button
            onClick={() => {
              track("create-recharge-code-button", {
                amount: amount,
                num: num,
                export: needExport,
              });
              void createRechargeCodeMutation.mutateAsync({
                amount: parseFloat(amount),
                num: num,
              });
            }}
            disabled={!amount || amount === "0"}
            loading={createRechargeCodeMutation.isLoading}
            success={createRechargeCodeMutation.isSuccess}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
