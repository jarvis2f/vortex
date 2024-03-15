import "reactflow/dist/style.css";
import NetworkTable from "~/app/(manage)/network/_components/network-table";

export const metadata = {
  title: "组网 - vortex",
};

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
