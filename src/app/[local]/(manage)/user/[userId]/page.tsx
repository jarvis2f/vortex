import { Separator } from "~/lib/ui/separator";
import ProfileForm from "~/app/[local]/(manage)/user/[userId]/_components/profile-form";
import { api } from "~/trpc/server";

export default async function SettingProfilePage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const user = await api.user.getOne.query({ id: userId });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">个人资料</h3>
        <p className="text-sm text-muted-foreground">
          设置你的名称和头像，需要重新登录后生效
        </p>
      </div>
      <Separator />
      <ProfileForm user={user} />
    </div>
  );
}
