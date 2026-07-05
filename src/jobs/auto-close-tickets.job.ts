import { prisma } from "../lib/prisma";

const AUTO_CLOSE_DAYS = 5;

export async function runAutoCloseTicketsJob(): Promise<void> {
  const cutoff = new Date(Date.now() - AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      status: "ANSWERED",
      messages: {
        some: {
          senderType: "ADMIN",
          createdAt: { lt: cutoff },
        },
      },
    },
    select: { id: true },
  });

  for (const ticket of tickets) {
    const lastAdminMessage = await prisma.ticketMessage.findFirst({
      where: { ticketId: ticket.id, senderType: "ADMIN" },
      orderBy: { createdAt: "desc" },
    });

    if (lastAdminMessage && lastAdminMessage.createdAt < cutoff) {
      const hasUserReplyAfter = await prisma.ticketMessage.findFirst({
        where: {
          ticketId: ticket.id,
          senderType: "USER",
          createdAt: { gt: lastAdminMessage.createdAt },
        },
      });

      if (!hasUserReplyAfter) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "CLOSED" },
        });
      }
    }
  }
}
