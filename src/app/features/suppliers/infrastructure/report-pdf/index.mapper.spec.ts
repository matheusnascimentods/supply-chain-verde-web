import { ReportDetail } from '../../domain/report/index.model';
import { reportPdfFileName, reportPdfVariables } from './index.mapper';
import { placeholdersOf } from './index.render';
import template from './index.template.md';

describe('report pdf mapper', () => {
  const report: ReportDetail = {
    reportId: 15,
    supplierId: 3,
    supplierCnpj: '12345678000190',
    supplierName: 'Fazenda Verde',
    periodStartAt: '2026-01-01',
    periodEndAt: '2026-06-30',
    totalCo2Kg: 6148.58,
    totalBatchCount: 9,
    trackedProductCount: 3,
    generatedAt: '2026-07-01T09:30:00',
    supplier: {
      phone: '11999990000',
      address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: null, zipCode: '01001000', city: 'São Paulo', state: 'SP' },
    },
    emissions: {
      byStage: [{ stageType: 'TRANSPORT', co2Kg: 3100.2 }],
      byBatch: [{ batchId: 42, productName: 'Café orgânico', quantity: 500, unit: 'KG', co2Kg: 812.4 }],
      byMethod: [{ calculationMethod: 'GHG_PROTOCOL', emissionFactor: 0.215, co2Kg: 4020 }],
    },
    certifications: [
      { certificationId: 1, certification: 'Orgânico Brasil', issuingBody: 'IBD', issuedAt: '2025-03-01', expiresAt: '2027-03-01', status: 'ACTIVE' },
    ],
  };

  it('formats the identification in the Brazilian standard', () => {
    const vars = reportPdfVariables(report);
    expect(vars['supplierCnpj']).toBe('12.345.678/0001-90');
    expect(vars['supplierPhone']).toBe('(11) 99999-0000');
    expect(vars['supplierAddress']).toBe('Rua A, 10 – Centro – São Paulo/SP – CEP 01001-000');
    expect(vars['generatedAt']).toBe('01/07/2026');
    expect(vars['periodEnd']).toBe('30/06/2026');
    expect(vars['totalCo2']).toBe('6.148,58');
  });

  it('builds the tables with translated labels', () => {
    const vars = reportPdfVariables(report);
    expect(vars['emissionsByStageTable']).toContain('| Transporte | 3.100,2 |');
    expect(vars['emissionsByBatchTable']).toContain('| #42 | Café orgânico | 500 kg | 812,4 |');
    expect(vars['emissionsByMethodTable']).toContain('| GHG Protocol | 0,215 | 4.020 |');
    expect(vars['certificationsTable']).toContain('| Orgânico Brasil | IBD | 01/03/2025 | 01/03/2027 | Ativa |');
  });

  it('turns empty lists into a sentence', () => {
    const vars = reportPdfVariables({ ...report, emissions: { byStage: [], byBatch: [], byMethod: [] }, certifications: [] });
    expect(vars['certificationsTable']).toBe('Nenhuma certificação vigente no período.');
    expect(vars['emissionsByStageTable']).not.toContain('|');
  });

  it('escapes values from the API', () => {
    expect(reportPdfVariables({ ...report, supplierName: 'A | *B*' })['supplierName']).toBe('A \\| \\*B\\*');
  });

  it('escapes the table cells from the API', () => {
    const byBatch = [{ ...report.emissions.byBatch[0], productName: 'Café | <b>' }];
    const vars = reportPdfVariables({ ...report, emissions: { ...report.emissions, byBatch } });
    expect(vars['emissionsByBatchTable']).toContain('| Café \\| &lt;b&gt; |');
  });

  it('fills every placeholder of the template', () => {
    const keys = Object.keys(reportPdfVariables(report));
    expect(placeholdersOf(template).filter((key) => !keys.includes(key))).toEqual([]);
  });

  it('names the file with the CNPJ and the period', () => {
    expect(reportPdfFileName(report)).toBe('relatorio-sustentabilidade-12345678000190-2026-01-01-2026-06-30');
  });
});
