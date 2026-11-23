export const PRODUCT_CATEGORIES = ['AGRICULTURE', 'LIVESTOCK', 'PROCESSED_FOOD', 'TEXTILE', 'FORESTRY', 'OTHER'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  AGRICULTURE: 'Agricultura',
  LIVESTOCK: 'Pecuária',
  PROCESSED_FOOD: 'Alimentos processados',
  TEXTILE: 'Têxtil',
  FORESTRY: 'Silvicultura',
  OTHER: 'Outro',
};

export const PRODUCT_UNITS = ['KG', 'TON', 'LITER', 'UNIT', 'M3'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];
export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  KG: 'Quilograma (kg)',
  TON: 'Tonelada (t)',
  LITER: 'Litro (L)',
  UNIT: 'Unidade (un)',
  M3: 'Metro cúbico (m³)',
};
export const PRODUCT_UNIT_SYMBOLS: Record<ProductUnit, string> = { KG: 'kg', TON: 't', LITER: 'L', UNIT: 'un', M3: 'm³' };

// supplierId em diante: campos do catálogo do mercado; null na visão do fornecedor (API RN-07).
export interface Product {
  productId: number;
  supplierId?: number | null;
  name: string;
  description?: string | null;
  category: ProductCategory;
  unit: ProductUnit;
  supplierName?: string | null;
  co2KgPerUnit?: number | null;
  acceptedBatchesLast30Days?: number | null;
}

export interface NewProduct {
  name: string;
  description: string;
  category: ProductCategory;
  unit: ProductUnit;
}

// Próprio de products, para a feature não depender de batches (que a consome).
export interface Page<T> {
  items: T[];
  totalPages: number;
}
