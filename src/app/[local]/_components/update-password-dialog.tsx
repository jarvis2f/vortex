import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import UpdatePasswordForm from "~/app/[local]/_components/update-password-form";
import { Button } from "~/lib/ui/button";
import { getTranslations } from "next-intl/server";

export default async function UpdatePasswordDialog({
  userId,
  type,
}: {
  userId: string;
  type: "setup" | "reset";
}) {
  const t = await getTranslations("global_update-password-dialog");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {type === "reset" ? t("change-password") : t("set-password")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("set-password")}</DialogTitle>
        </DialogHeader>
        <UpdatePasswordForm userId={userId} type={type} />
      </DialogContent>
    </Dialog>
  );
}
