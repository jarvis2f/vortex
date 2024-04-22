import { Separator } from "~/lib/ui/separator";
import ProfileForm from "~/app/[local]/(manage)/user/[userId]/_components/profile-form";
import { api } from "~/trpc/server";
import { getTranslations } from "next-intl/server";

export default async function SettingProfilePage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const user = await api.user.getOne.query({ id: userId });
  const t = await getTranslations("user-[userId]");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("profile")}</h3>
        <p className="text-sm text-muted-foreground">{t("set_name_avatar")}</p>
      </div>
      <Separator />
      <ProfileForm user={user} />
    </div>
  );
}
