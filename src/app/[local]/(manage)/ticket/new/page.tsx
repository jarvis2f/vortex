import NewTicketForm from "~/app/[local]/(manage)/ticket/_components/new-ticket-form";

export const metadata = {
  title: "工单 - vortex",
};

export default function () {
  return (
    <div className="h-full p-4">
      <h1 className="mb-4 text-3xl">创建工单</h1>
      <NewTicketForm />
    </div>
  );
}
