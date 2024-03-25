import "reactflow/dist/style.css";
import NetworkTable from "~/app/[local]/(manage)/network/_components/network-table";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "global_menu" });

  return {
    title: `${t("network")} - vortex`,
  };
}

export default async function NetworksPage({
  searchParams: { keyword },
}: {
  searchParams: { keyword: string };
}) {
  return (
    <div className="h-full p-4">
      <div className="flex gap-4">
        <h1 className="mb-4 text-3xl">Network</h1>
      </div>
      <NetworkTable keyword={keyword} />
    </div>
  );
}
