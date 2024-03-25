import { api } from "~/trpc/server";
import Markdown from "react-markdown";
import UserColumn from "~/app/[local]/_components/user-column";
import TicketReply from "~/app/[local]/(manage)/ticket/_components/ticket-reply";
import TicketStatusBadge from "~/app/[local]/(manage)/ticket/_components/ticket-status-badge";
import dayjs from "dayjs";

export const metadata = {
  title: "工单 - vortex",
};

export default async function TicketPage({
  params: { ticketId },
}: {
  params: { ticketId: string };
}) {
  const ticket = await api.ticket.getOne.query({ id: ticketId });
  return (
    <div className="h-full p-4">
      <div className="flex gap-4">
        <h1 className="mb-4 text-3xl">工单</h1>
      </div>
      <div className="lg:mx-auto lg:max-w-5xl lg:space-y-4">
        <div className="space-y-3">
          <UserColumn user={ticket.createdBy} />
          <div className="flex items-center justify-center">
            <h1 className="text-center text-3xl">
              {ticket.title}
              <p className="mt-2 text-xs text-muted-foreground">
                <TicketStatusBadge className="mr-3" status={ticket.status} />
                创建时间：
                {dayjs(ticket.createdAt).locale("zh-cn").fromNow()}
              </p>
            </h1>
          </div>
          <Markdown className="markdown">{ticket.content}</Markdown>
        </div>
        <div className="space-y-3 py-3">
          {ticket.replies.map((reply) => (
            <div key={reply.id} className="flex space-x-3 rounded border p-3">
              <div className="space-y-2">
                <UserColumn user={reply.createdBy} />
                <p className="text-right text-xs text-muted-foreground">
                  {dayjs(reply.createdAt).locale("zh-cn").fromNow()}
                </p>
              </div>
              <Markdown className="markdown max-h-[200px] flex-1 overflow-y-scroll">
                {reply.content}
              </Markdown>
            </div>
          ))}
        </div>
        <TicketReply ticketId={ticketId} />
      </div>
    </div>
  );
}
