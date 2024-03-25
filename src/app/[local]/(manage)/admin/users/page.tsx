import UserTable from "~/app/[local]/(manage)/admin/users/_components/user-table";

export const metadata = {
  title: "用户 - vortex",
};

export default async function UserListPage() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl">用户</h1>
      <UserTable />
    </div>
  );
}
