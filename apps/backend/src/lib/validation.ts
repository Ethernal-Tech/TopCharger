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

// Lightweight Solana pubkey check: base58, 32–44 chars (ed25519 pubkeys are 32 bytes => 44 chars base58).
const base58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

export const upsertDriverProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[0-9+()\-.\s]+$/i, "Invalid phone format")
    .optional(),
  solanaPubkey: z
    .string()
    .min(32)
    .max(44)
    .regex(base58, "Not a base58 string")
    .optional(),
  preferredConnector: z
    .enum(["TYPE2", "CCS2", "CHADEMO", "CCS1", "NEMA14_50", "SCHUKO"])
    .optional(),
});