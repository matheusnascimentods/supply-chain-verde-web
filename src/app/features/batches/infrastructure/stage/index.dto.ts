import { z } from 'zod';
import {
  CALCULATION_METHODS,
  ENERGY_SOURCES,
  FUEL_TYPES,
  STAGE_TYPES,
  TRANSPORT_MODES,
} from '../../domain/stage/index.model';

const nullableString = z.string().nullable().optional();

export const stageAddressSchema = z.object({
  addressId: z.number(),
  street: nullableString,
  number: nullableString,
  neighborhood: nullableString,
  complement: nullableString,
  zipCode: nullableString,
  city: nullableString,
  state: nullableString,
});

export const transportResponseSchema = z.object({
  transportId: z.number(),
  chainId: z.number(),
  transportMode: z.enum(TRANSPORT_MODES),
  distance: z.number(),
  fuelType: z.enum(FUEL_TYPES),
  capacity: z.number(),
});

export const carbonEmissionResponseSchema = z.object({
  emissionId: z.number(),
  chainId: z.number(),
  emissionFactor: z.number(),
  co2Kg: z.number(),
  calculationMethod: z.enum(CALCULATION_METHODS),
  calculatedAt: z.string(),
  cargoWeightKg: z.number().nullable().optional(),
  energySource: z.enum(ENERGY_SOURCES).nullable().optional(),
  consumption: z.number().nullable().optional(),
});

export const emissionFactorSchema = z.object({
  calculationMethod: z.enum(CALCULATION_METHODS),
  transportMode: z.enum(TRANSPORT_MODES).nullable(),
  fuelType: z.enum(FUEL_TYPES).nullable(),
  energySource: z.enum(ENERGY_SOURCES).nullable(),
  value: z.number(),
  unit: z.string(),
  source: z.string(),
  referenceYear: z.number(),
});

export const stageResponseSchema = z.object({
  chainId: z.number(),
  batchId: z.number(),
  originAddress: stageAddressSchema.nullable(),
  destinationAddress: stageAddressSchema.nullable(),
  responsibleUserId: z.number(),
  responsibleUserName: z.string(),
  stageType: z.enum(STAGE_TYPES),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  transport: transportResponseSchema.nullable(),
  emission: carbonEmissionResponseSchema.nullable(),
});
