import { CALCULATION_METHOD_LABELS, PRODUCT_UNIT_SYMBOLS, STAGE_TYPE_LABELS } from '../../../batches';
import { CERTIFICATION_STATUS_LABELS } from '../../../certifications';
import { digitsOnly, formatCnpj, formatIsoDateBr, formatNumberBr, formatPhone, formatZipCode } from '../../../../shared/utils/format/index.utils';
import { SupplierAddress } from '../../domain/index.model';
import { ReportDetail } from '../../domain/report/index.model';
import { escapeMarkdown } from './index.render';

/** `ReportDetail` → variáveis do template, já formatadas e escapadas. */
export function reportPdfVariables(report: ReportDetail): Record<string, string> {
  const { emissions } = report;
  const scalars: Record<string, string> = {
    reportId: String(report.reportId),
    generatedAt: report.generatedAt ? formatIsoDateBr(report.generatedAt) : '',
    supplierName: report.supplierName ?? '',
    supplierCnpj: report.supplierCnpj ? formatCnpj(report.supplierCnpj) : '',
    supplierAddress: formatAddress(report.supplier.address),
    supplierPhone: report.supplier.phone ? formatPhone(report.supplier.phone) : '',
    periodStart: formatIsoDateBr(report.periodStartAt),
    periodEnd: formatIsoDateBr(report.periodEndAt),
    totalCo2: formatNumberBr(report.totalCo2Kg),
    batchCount: formatNumberBr(report.totalBatchCount),
    productCount: report.trackedProductCount == null ? '' : formatNumberBr(report.trackedProductCount),
  };
  return {
    ...Object.fromEntries(Object.entries(scalars).map(([key, value]) => [key, escapeMarkdown(value)])),
    emissionsByStageTable: table(
      ['Etapa', 'CO₂e (kg)'],
      emissions.byStage.map((row) => [STAGE_TYPE_LABELS[row.stageType], formatNumberBr(row.co2Kg)]),
      'Nenhuma emissão registrada no período.',
    ),
    emissionsByBatchTable: table(
      ['Lote', 'Produto', 'Quantidade', 'CO₂e (kg)'],
      emissions.byBatch.map((row) => [
        `#${row.batchId}`,
        row.productName,
        `${formatNumberBr(row.quantity)} ${PRODUCT_UNIT_SYMBOLS[row.unit]}`,
        formatNumberBr(row.co2Kg),
      ]),
      'Nenhum lote com emissões no período.',
    ),
    emissionsByMethodTable: table(
      ['Metodologia', 'Fator de emissão', 'CO₂e (kg)'],
      emissions.byMethod.map((row) => [
        CALCULATION_METHOD_LABELS[row.calculationMethod],
        formatNumberBr(row.emissionFactor, 8),
        formatNumberBr(row.co2Kg),
      ]),
      'Nenhuma metodologia aplicada no período.',
    ),
    certificationsTable: table(
      ['Certificação', 'Órgão emissor', 'Emissão', 'Validade', 'Status'],
      report.certifications.map((row) => [
        row.certification,
        row.issuingBody,
        formatIsoDateBr(row.issuedAt),
        formatIsoDateBr(row.expiresAt),
        CERTIFICATION_STATUS_LABELS[row.status],
      ]),
      'Nenhuma certificação vigente no período.',
    ),
  };
}

/** Sem extensão: o navegador usa o título do documento como nome do PDF e acrescenta `.pdf`. */
export function reportPdfFileName(report: ReportDetail): string {
  const cnpj = digitsOnly(report.supplierCnpj ?? '') || String(report.supplierId);
  return `relatorio-sustentabilidade-${cnpj}-${report.periodStartAt}-${report.periodEndAt}`;
}

function formatAddress(address: SupplierAddress | null | undefined): string {
  if (!address) return '';
  const street = [address.street, address.number].filter(Boolean).join(', ');
  const city = [address.city, address.state].filter(Boolean).join('/');
  const zipCode = address.zipCode ? `CEP ${formatZipCode(address.zipCode)}` : '';
  return [street, address.complement, address.neighborhood, city, zipCode].filter(Boolean).join(' – ');
}

function table(headers: string[], rows: string[][], empty: string): string {
  if (rows.length === 0) return empty;
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map((row) => line(row.map(escapeMarkdown)))].join('\n');
}
