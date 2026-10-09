# Plano técnico — Relatório de sustentabilidade em PDF

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Ideia geral

O documento é texto fixo com lacunas. Em vez de montar o PDF elemento a elemento no código, mantemos um **template** legível, com placeholders, e uma função pequena que preenche:

1. O template é um arquivo `.md` com placeholders `{{nome}}`, importado como texto no build (carregado uma vez, sem requisição).
2. Um mapper transforma o detalhe do relatório num dicionário `Record<string, string>` já formatado (datas, números, rótulos) e escapado. Partes repetidas (linhas das tabelas) são geradas pelo mapper como texto Markdown e entram num único placeholder.
3. `render(template, vars)` troca cada `{{chave}}` pelo valor; ausente vira "—".
4. O Markdown preenchido vira HTML e o HTML vira PDF, que é baixado.

Com isso, mudar o layout do relatório é editar o `.md`, sem mexer em lógica.

## 2. Template (`features/suppliers/infrastructure/report-pdf/index.template.md`)

```md
# Relatório de Sustentabilidade

**Relatório nº {{reportId}}** · gerado em {{generatedAt}}

## Identificação

| | |
|---|---|
| Razão social | {{supplierName}} |
| CNPJ | {{supplierCnpj}} |
| Endereço | {{supplierAddress}} |
| Telefone | {{supplierPhone}} |
| Período | {{periodStart}} a {{periodEnd}} |

## Emissões

**Total no período:** {{totalCo2}} kg CO₂e · {{batchCount}} lotes · {{productCount}} produtos

### Por etapa
{{emissionsByStageTable}}

### Por lote
{{emissionsByBatchTable}}

### Metodologia
{{emissionsByMethodTable}}

## Certificações
{{certificationsTable}}
```

## 3. Bibliotecas

| Passo | Biblioteca | Motivo |
|---|---|---|
| Markdown → HTML | `marked` | Pequena, sem dependências. |
| HTML → PDF | `html2pdf.js` | Baixa o arquivo direto, sem diálogo de impressão. |

Limitação conhecida: o `html2pdf.js` rasteriza o HTML (o texto do PDF não é selecionável). Se isso incomodar a banca/auditor, a alternativa é trocar só o passo final por `window.print()` com CSS `@media print`, mantendo template e mapper.

Ambas carregadas com `import()` dinâmico no clique, para não pesar o bundle inicial.

`angular.json` (`build.options`): `"loader": { ".md": "text" }`, e `src/typings.d.ts` com `declare module '*.md' { const content: string; export default content; }`.

## 4. Camadas (`features/suppliers`)

| Camada | Arquivo | Papel |
|---|---|---|
| `domain` | `index.model.ts` | `ReportDetail` com as seções novas. |
| `infrastructure` | `index.dto.ts` | Schema Zod do detalhe enriquecido. |
| `infrastructure/report-pdf` | `index.template.md` | Template. |
| `infrastructure/report-pdf` | `index.render.ts` | `render(template, vars)` e `escapeMarkdown(value)`. |
| `infrastructure/report-pdf` | `index.mapper.ts` | `ReportDetail` → variáveis do template (formatação + tabelas). |
| `infrastructure/report-pdf` | `index.exporter.ts` | `marked` + `html2pdf.js` + nome do arquivo. |
| `application/use-cases/download-report-pdf` | `index.use-case.ts` | Busca o detalhe, monta as variáveis, renderiza e exporta. |
| `presentation/components/reports-modal` | — | Botão "Baixar PDF" com estado de carregando por linha. |

Rótulos de enums e formatação reaproveitam `shared/utils/format` e os labels já existentes nas features.

## 5. Testes

- `render`: substitui, usa "—" para ausente, mantém texto fora dos placeholders.
- `escapeMarkdown`: `|`, `*`, `_`, `<` não quebram a tabela nem viram HTML.
- Mapper: datas/números BR, listas vazias viram frase.
- Template × mapper: todo `{{placeholder}}` do template existe nas chaves do mapper (RNF-02).
- Use-case: com o exporter mockado, recebe o nome de arquivo e o HTML esperados.
