import TicketTable from "~/app/(manage)/ticket/_components/ticket-table";

export const metadata = {
  title: "工单 - vortex",
};

export default function TicketsPage({
  searchParams: { keyword },
}: {
  searchParams: { keyword: string };
}) {
  return (
    <div className="h-full p-4">
      <div className="flex gap-4">
        <h1 className="mb-4 text-3xl">工单</h1>
      </div>
      <TicketTable keyword={keyword} />
    </div>
  );
}
