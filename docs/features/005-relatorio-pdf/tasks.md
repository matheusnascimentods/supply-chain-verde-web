# Tarefas — Relatório de sustentabilidade em PDF

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** implementado. Depende da API (`supply-chain-verde-api/docs/features/005-relatorio-pdf/tasks.md`).

---

## Task 1 — `feat/report-pdf-template`

- [x] Loader `.md` no `angular.json` e typing
- [x] Template, `render`, `escapeMarkdown` e mapper, com specs
- [x] DTO/model do detalhe enriquecido

## Task 2 — `feat/report-pdf-download`

- [x] `npm i marked` (PDF via `window.print`, sem `html2pdf.js`)
- [x] Exporter com import dinâmico
- [x] Use-case `download-report-pdf` e spec
- [x] Botão "Baixar PDF" no modal de relatórios
