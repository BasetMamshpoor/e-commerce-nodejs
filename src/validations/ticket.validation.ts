import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
});
export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  departmentId: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  orderId: z.string().optional(),
  message: z.string().trim().min(1).max(5000),
  attachmentMediaIds: z.array(z.string()).optional().default([]),
});

export const addTicketMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  attachmentMediaIds: z.array(z.string()).optional().default([]),
});

export const updateTicketMetaSchema = z.object({
  status: z.enum(["OPEN", "ANSWERED", "CLOSED", "PENDING_CUSTOMER"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  departmentId: z.string().optional(),
});

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["OPEN", "ANSWERED", "CLOSED", "PENDING_CUSTOMER"]).optional(),
});

export const adminListTicketsQuerySchema = listTicketsQuerySchema.extend({
  departmentId: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  search: z.string().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
export type UpdateTicketMetaInput = z.infer<typeof updateTicketMetaSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type AdminListTicketsQuery = z.infer<typeof adminListTicketsQuerySchema>;
