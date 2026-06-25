import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramStr } from "../utils/params";
import * as ticketService from "../services/ticket/ticket.service";
import * as departmentService from "../services/ticket/department.service";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

// --- مشتری ---

export async function create(req: Request, res: Response) {
  const ticket = await ticketService.createTicket(userId(req), req.body);
  return ApiResponse.created(res, ticket, "تیکت با موفقیت ثبت شد");
}

export async function listMine(req: Request, res: Response) {
  return ApiResponse.ok(res, await ticketService.listMyTickets(userId(req), req.validatedQuery as never));
}

export async function getMine(req: Request, res: Response) {
  return ApiResponse.ok(res, await ticketService.getTicketDetail(paramStr(req.params.id), userId(req)));
}

export async function addMessage(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const ticket = await ticketService.addMessage(
    paramStr(req.params.id),
    req.user.id,
    req.user.role,
    req.body
  );
  return ApiResponse.ok(res, ticket, "پیام ارسال شد");
}

// --- ادمین/پشتیبانی ---

export async function listAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await ticketService.listTicketsAdmin(req.validatedQuery as never));
}

export async function getByIdAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await ticketService.getTicketDetail(paramStr(req.params.id)));
}

export async function updateMeta(req: Request, res: Response) {
  const ticket = await ticketService.updateTicketMeta(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, ticket, "تیکت به‌روزرسانی شد");
}

// --- بخش‌های پشتیبانی ---

export async function createDepartment(req: Request, res: Response) {
  return ApiResponse.created(res, await departmentService.createDepartment(req.body), "بخش ایجاد شد");
}

export async function updateDepartment(req: Request, res: Response) {
  const department = await departmentService.updateDepartment(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, department, "بخش به‌روزرسانی شد");
}

export async function removeDepartment(req: Request, res: Response) {
  await departmentService.deleteDepartment(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "بخش حذف شد");
}

export async function listDepartments(_req: Request, res: Response) {
  return ApiResponse.ok(res, await departmentService.listDepartments());
}
