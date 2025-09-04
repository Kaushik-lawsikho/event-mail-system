const { z } = require("zod");

const leadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  source: z.string().default("website"),
});

const bookingSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  bookingId: z.string().min(1),
  date: z.string(), // ISO
});

const purchaseSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  orderId: z.string().min(1),
  total: z.number().nonnegative(),
  currency: z.string().default("INR")
});

module.exports = { leadSchema, bookingSchema, purchaseSchema };
