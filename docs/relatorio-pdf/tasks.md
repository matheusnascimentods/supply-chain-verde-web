# Tarefas — Relatório de sustentabilidade em PDF

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** não iniciado. Depende da API (`supply-chain-verde-api/docs/relatorio-pdf/tasks.md`).

---

## Task 1 — `feat/report-pdf-template`

- [ ] Loader `.md` no `angular.json` e typing
- [ ] Template, `render`, `escapeMarkdown` e mapper, com specs
- [ ] DTO/model do detalhe enriquecido

## Task 2 — `feat/report-pdf-download`

- [ ] `npm i marked html2pdf.js`
- [ ] Exporter com import dinâmico
- [ ] Use-case `download-report-pdf` e spec
- [ ] Botão "Baixar PDF" no modal de relatórios
