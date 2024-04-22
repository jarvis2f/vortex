import { Separator } from "~/lib/ui/separator";
import { api } from "~/trpc/server";
import { Label } from "~/lib/ui/label";
import UpdatePasswordDialog from "~/app/[local]/_components/update-password-dialog";
import { getTranslations } from "next-intl/server";

export default async function UserAccountPage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const t = await getTranslations("user-[userId]-account");
  const user = await api.user.getOne.query({ id: userId });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("account")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("view_update_account_info")}
        </p>
      </div>
      <Separator />
      <div className="space-y-6">
        <div className="space-y-1">
          <Label>{t("email")}</Label>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex justify-between">
          <div className="space-y-1">
            <Label>{t("password")}</Label>
            <p className="text-muted-foreground">
              {user.isSetupPassword ? "********" : t("password_not_set")}
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
