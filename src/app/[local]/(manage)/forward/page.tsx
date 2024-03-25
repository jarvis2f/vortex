import ForwardTable from "~/app/[local]/(manage)/forward/_components/forward-table";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "global_menu" });

  return {
    title: `${t("forward")} - vortex`,
  };
}

export default async function Forward() {
  const t = await getTranslations("global_menu");
  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl">{t("forward")}</h1>
      <ForwardTable />
    </div>
  );
}
