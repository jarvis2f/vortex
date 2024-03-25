import TicketTable from "~/app/[local]/(manage)/ticket/_components/ticket-table";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "global_menu" });

  return {
    title: `${t("ticket")} - vortex`,
  };
}

export default async function TicketsPage({
  searchParams: { keyword },
}: {
  searchParams: { keyword: string };
}) {
  const t = await getTranslations("global_menu");
  return (
    <div className="h-full p-4">
      <div className="flex gap-4">
        <h1 className="mb-4 text-3xl">{t("ticket")}</h1>
      </div>
      <TicketTable keyword={keyword} />
    </div>
  );
}
