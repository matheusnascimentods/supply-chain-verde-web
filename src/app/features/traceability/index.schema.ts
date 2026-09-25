import { z } from 'zod';

export const addressResponseSchema = z.object({
  addressId: z.number(),
  street: z.string(),
  number: z.string(),
  neighborhood: z.string(),
  complement: z.string(),
  zipCode: z.string(),
  city: z.string(),
  state: z.string(),
});

export const transportModeSchema = z.enum(['ROAD', 'RAIL', 'MARITIME', 'AIR']);
export const fuelTypeSchema = z.enum([
  'DIESEL', 'BIODIESEL', 'ELECTRIC', 'GASOLINE', 'ETHANOL', 'AVIATION_KEROSENE', 'HEAVY_FUEL_OIL',
]);
export const calculationMethodSchema = z.enum(['DEFRA', 'GHG_PROTOCOL', 'IPCC', 'EMEP_EEA']);
export const stageTypeSchema = z.enum([
  'PRODUCTION', 'STORAGE', 'PROCESSING', 'TRANSPORT', 'DISTRIBUTION', 'RETAIL',
]);

export const transportResponseSchema = z.object({
  transportId: z.number(),
  chainId: z.number(),
  transportMode: transportModeSchema,
  distance: z.number(),
  fuelType: fuelTypeSchema,
  capacity: z.number(),
});

export const carbonEmissionResponseSchema = z.object({
  emissionId: z.number(),
  chainId: z.number(),
  emissionFactor: z.number(),
  co2Kg: z.number(),
  calculationMethod: calculationMethodSchema,
  calculatedAt: z.string(),
});

export const chainResponseSchema = z.object({
  chainId: z.number(),
  batchId: z.number(),
  originAddress: addressResponseSchema.nullable(),
  destinationAddress: addressResponseSchema.nullable(),
  responsibleUserId: z.number(),
  responsibleUserName: z.string(),
  stageType: stageTypeSchema,
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  transport: transportResponseSchema.nullable(),
  emission: carbonEmissionResponseSchema.nullable(),
});

export const batchTraceabilityResponseSchema = z.object({
  batchId: z.number(),
  productName: z.string(),
  supplierName: z.string(),
  quantity: z.number(),
  producedAt: z.string(),
  stages: z.array(chainResponseSchema),
  totalCo2Kg: z.number(),
});

export const carbonFootprintResponseSchema = z.object({
  batchId: z.number(),
  totalCo2Kg: z.number(),
  emissionsByStage: z.array(carbonEmissionResponseSchema),
});

export type AddressResponseDTO = z.infer<typeof addressResponseSchema>;
export type ChainResponseDTO = z.infer<typeof chainResponseSchema>;
export type CarbonEmissionResponseDTO = z.infer<typeof carbonEmissionResponseSchema>;
export type BatchTraceabilityResponseDTO = z.infer<typeof batchTraceabilityResponseSchema>;
export type CarbonFootprintResponseDTO = z.infer<typeof carbonFootprintResponseSchema>;
