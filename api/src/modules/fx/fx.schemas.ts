import { z } from "zod";

export const updateFxRateSchema = z.object({
  usdToEtb: z.number().positive("usdToEtb must be greater than zero"),
  chfToEtb: z.number().positive("chfToEtb must be greater than zero"),
  source: z.string().max(50).optional(),
});

export type UpdateFxRateInput = z.infer<typeof updateFxRateSchema>;
