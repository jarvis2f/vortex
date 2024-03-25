import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import UpdatePasswordForm from "~/app/[local]/_components/update-password-form";
import { Button } from "~/lib/ui/button";

export default function UpdatePasswordDialog({
  userId,
  type,
}: {
  userId: string;
  type: "setup" | "reset";
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{type === "reset" ? "更改密码" : "设置密码"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>更新密码</DialogTitle>
        </DialogHeader>
        <UpdatePasswordForm userId={userId} type={type} />
      </DialogContent>
    </Dialog>
  );
}
