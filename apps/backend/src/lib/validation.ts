import { z } from "zod";

export const createHostProfileSchema = z.object({
  businessName: z.string().min(2),
  bankAccountIban: z.string().min(4).optional(),
  bankAccountName: z.string().min(2).optional(),
});

export const createChargerSchema = z.object({
  name: z.string().min(2),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  pricePerKwh: z.number().positive(),
  connector: z.enum(["TYPE2","CCS2","CHADEMO","CCS1","NEMA14_50","SCHUKO"]),
  available: z.boolean().optional(), // default true
});
