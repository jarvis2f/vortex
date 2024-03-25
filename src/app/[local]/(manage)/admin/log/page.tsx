import { Logs } from "~/app/[local]/(manage)/admin/log/_components/logs";

export const metadata = {
  title: "日志 - vortex",
};

export default function LogPage() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl">日志</h1>
      <Logs />
    </div>
  );
}
