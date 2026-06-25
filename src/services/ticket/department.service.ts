import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreateDepartmentInput, UpdateDepartmentInput } from "../../validations/ticket.validation";
import { TicketDepartment } from "../../generated/prisma";

export async function createDepartment(input: CreateDepartmentInput): Promise<TicketDepartment> {
  return prisma.ticketDepartment.create({ data: input });
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput
): Promise<TicketDepartment> {
  const department = await prisma.ticketDepartment.findUnique({ where: { id } });
  if (!department) throw ApiError.notFound("بخش پشتیبانی پیدا نشد");
  return prisma.ticketDepartment.update({ where: { id }, data: input });
}

export async function deleteDepartment(id: string): Promise<void> {
  const department = await prisma.ticketDepartment.findUnique({ where: { id } });
  if (!department) throw ApiError.notFound("بخش پشتیبانی پیدا نشد");

  const ticketCount = await prisma.ticket.count({ where: { departmentId: id } });
  if (ticketCount > 0) {
    throw ApiError.conflict("این بخش تیکت دارد و قابل حذف نیست");
  }

  await prisma.ticketDepartment.delete({ where: { id } });
}

export async function listDepartments(): Promise<TicketDepartment[]> {
  return prisma.ticketDepartment.findMany({ orderBy: { name: "asc" } });
}
