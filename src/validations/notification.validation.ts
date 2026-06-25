import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  isRead: z.coerce.boolean().optional(),
});

export const broadcastNotificationSchema = z.object({
  userIds: z.array(z.string()).optional(),
  type: z.enum(["ORDER", "SYSTEM", "TICKET", "PROMOTION", "WALLET", "COMMENT"]),
  title: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(1000),
  link: z.string().optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
