import RechargeCodeTable from "~/app/[local]/(manage)/admin/config/_components/recharge-code-table";
import { Separator } from "~/lib/ui/separator";
import Link from "next/link";
import { MoveRightIcon } from "lucide-react";
import { getServerAuthSession } from "~/server/auth";

export default async function RechargeCodeConfigPage() {
  const session = await getServerAuthSession();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">充值码</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          管理充值码，可以批量生成导出充值码 充值码在
          <Link
            href={`/user/${session?.user.id}/balance`}
            className="flex items-center gap-2 rounded border bg-accent px-2"
          >
            个人中心
            <MoveRightIcon className="h-4 w-4" />
            余额
          </Link>
          充值使用
        </div>
      </div>
      <Separator />
      <RechargeCodeTable />
    </div>
  );
}
