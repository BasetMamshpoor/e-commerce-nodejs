import { z } from "zod";

// Validates actual IPv4/IPv6 shape — previously any string 3-45 chars was
// accepted, so a typo (e.g. "192.168.1.9990" or plain garbage text) silently
// created a "blocked IP" entry that would never match any real request,
// giving the admin false confidence they'd blocked something.
const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

export const createBlockedIpSchema = z.object({
  ip: z
    .string()
    .trim()
    .min(3)
    .max(45)
    .refine((v) => ipv4Pattern.test(v) || ipv6Pattern.test(v), {
      message: "فرمت آدرس IP معتبر نیست",
    }),
  reason: z.string().trim().max(500).optional(),
  expiresAt: z.coerce.date().optional(), // اگر نباشد یعنی برای همیشه
});

export type CreateBlockedIpInput = z.infer<typeof createBlockedIpSchema>;
