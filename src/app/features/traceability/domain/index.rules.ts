import { StageAddress } from './index.model';

/** O código público do lote (na URL /rastreio/:batchId) é o id numérico. */
export function isValidBatchCode(value: string | null): value is string {
  return !!value && /^\d+$/.test(value);
}

/** "Cidade, UF" com o que estiver preenchido; vazio quando o endereço não informa nenhum dos dois. */
export function placeOf(address: StageAddress | null): string {
  return address ? [address.city, address.state].filter(Boolean).join(', ') : '';
}
