import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { notifyUser } from "../notification/notification.service";
import {
  CreateTicketInput,
  AddTicketMessageInput,
  UpdateTicketMetaInput,
  ListTicketsQuery,
  AdminListTicketsQuery,
} from "../../validations/ticket.validation";
import { Ticket, Role } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// سیستم تیکتینگ — آیتم ۱۳.
// قاعده‌ی ساده‌ی وضعیت: تیکت تازه = OPEN، وقتی پشتیبانی پاسخ می‌دهد = ANSWERED،
// وقتی دوباره کاربر پیام می‌دهد = OPEN (نوبت پشتیبانی)، CLOSED فقط دستی
// (توسط پشتیبانی یا خود کاربر) ست می‌شود؛ پیام جدید روی تیکت بسته آن را
// خودکار دوباره باز می‌کند.
// ----------------------------------------------------------------------------

const TICKET_DETAIL_INCLUDE = {
  department: true,
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { attachments: { include: { media: true } } },
  },
};

export async function createTicket(userId: string, input: CreateTicketInput): Promise<Ticket> {
  if (input.departmentId) {
    const department = await prisma.ticketDepartment.findUnique({
      where: { id: input.departmentId },
    });
    if (!department) throw ApiError.badRequest("بخش پشتیبانی انتخاب‌شده معتبر نیست");
  }

  return prisma.ticket.create({
    data: {
      userId,
      subject: input.subject,
      departmentId: input.departmentId,
      priority: input.priority,
      orderId: input.orderId,
      status: "OPEN",
      messages: {
        create: {
          senderId: userId,
          senderType: "USER",
          message: input.message,
          attachments: {
            create: input.attachmentMediaIds.map((mediaId) => ({ mediaId })),
          },
        },
      },
    },
  });
}

export async function addMessage(
  ticketId: string,
  senderId: string,
  senderRole: Role,
  input: AddTicketMessageInput
): Promise<Ticket> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw ApiError.notFound("تیکت پیدا نشد");

  const isStaff = senderRole !== "CUSTOMER";
  if (!isStaff && ticket.userId !== senderId) {
    throw ApiError.notFound("تیکت پیدا نشد");
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId,
      senderType: isStaff ? "ADMIN" : "USER",
      message: input.message,
      attachments: { create: input.attachmentMediaIds.map((mediaId) => ({ mediaId })) },
    },
  });

  const newStatus = isStaff ? "ANSWERED" : "OPEN";
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: newStatus },
  });

  if (isStaff) {
    notifyUser({
      userId: ticket.userId,
      type: "TICKET",
      title: `پاسخ جدید برای تیکت «${ticket.subject}»`,
      message: input.message.slice(0, 200),
      link: `/tickets/${ticket.id}`,
    }).catch(() => undefined);
  }

  return updated;
}

export async function getTicketDetail(ticketId: string, userId?: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: TICKET_DETAIL_INCLUDE,
  });
  if (!ticket) throw ApiError.notFound("تیکت پیدا نشد");
  if (userId && ticket.userId !== userId) throw ApiError.notFound("تیکت پیدا نشد");
  return ticket;
}

export async function listMyTickets(userId: string, query: ListTicketsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = { userId, ...(query.status ? { status: query.status } : {}) };

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { department: true },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function listTicketsAdmin(query: AdminListTicketsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.search ? { subject: { contains: query.search, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        department: true,
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function updateTicketMeta(
  ticketId: string,
  input: UpdateTicketMetaInput
): Promise<Ticket> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw ApiError.notFound("تیکت پیدا نشد");

  if (input.departmentId) {
    const department = await prisma.ticketDepartment.findUnique({
      where: { id: input.departmentId },
    });
    if (!department) throw ApiError.badRequest("بخش پشتیبانی انتخاب‌شده معتبر نیست");
  }

  return prisma.ticket.update({ where: { id: ticketId }, data: input });
}
