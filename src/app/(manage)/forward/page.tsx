import ForwardTable from "~/app/(manage)/forward/_components/forward-table";

export const metadata = {
  title: "转发 - vortex",
};

export default function Forward() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl">转发</h1>
      <ForwardTable />
    </div>
  );
}
