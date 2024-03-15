import { Separator } from "~/lib/ui/separator";
import { api } from "~/trpc/server";
import { Label } from "~/lib/ui/label";
import UpdatePasswordDialog from "~/app/_components/update-password-dialog";

export default async function UserAccountPage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const user = await api.user.getOne.query({ id: userId });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">账号</h3>
        <p className="text-sm text-muted-foreground">查看和更新你的账号信息</p>
      </div>
      <Separator />
      <div className="space-y-6">
        <div className="space-y-1">
          <Label>邮箱</Label>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex justify-between">
          <div className="space-y-1">
            <Label>密码</Label>
            <p className="text-muted-foreground">
              {user.isSetupPassword ? "********" : "未设置密码"}
            </p>
          </div>
          <UpdatePasswordDialog
            userId={userId}
            type={user.isSetupPassword ? "reset" : "setup"}
          />
        </div>
      </div>
    </div>
  );
}
