const { z } = require("zod");

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const createIssueSchema = z.object({
  orderId: z
    .union([objectId, z.literal("")])
    .optional()
    .transform((value) => value || undefined),

  productId: z
    .union([objectId, z.literal("")])
    .optional()
    .transform((value) => value || undefined),

  subject: z.string().trim().min(2, "Subject must be at least 2 characters"),

  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters"),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional()
    .default("MEDIUM"),
});

const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

  assignedTo: z
    .union([objectId, z.literal("")])
    .optional()
    .transform((value) => value || undefined),

  response: z.string().optional(),
});

module.exports = {
  createIssueSchema,
  updateIssueSchema,
};