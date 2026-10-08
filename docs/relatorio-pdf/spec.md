# Especificação — Relatório de sustentabilidade em PDF

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Dados vindos da API: `supply-chain-verde-api/docs/relatorio-pdf/spec.md`.

## 1. Problema

O tema da A3 pede "relatórios para certificação". Hoje o relatório só aparece como totais dentro do modal de relatórios do fornecedor; não há um documento para entregar a uma certificadora ou auditor.

## 2. Objetivo

Botão "Baixar PDF" em cada relatório, gerando no navegador um documento a partir de um template preenchido com o detalhe do relatório.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | Botão "Baixar PDF" em cada linha do modal de relatórios, para quem já pode ver o relatório (`admin`, `manager`, `auditor` e o `supplier` dono). |
| RF-02 | O PDF é gerado a partir de `GET /reports?reportId=` e de um template Markdown com placeholders, versionado no frontend. |
| RF-03 | Seções do documento: **Identificação** (razão social, CNPJ, endereço, telefone, período, data de geração, nº do relatório), **Emissões** (total, por etapa, por lote, por metodologia com o fator usado) e **Certificações** (nome, órgão emissor, emissão, validade, status). |
| RF-04 | Datas e números no padrão brasileiro; enums traduzidos (etapas, status, metodologias) com os rótulos já usados nas telas. |
| RF-05 | Listas vazias viram uma frase ("Nenhuma certificação vigente no período."), não tabela vazia. |
| RF-06 | Nome do arquivo: `relatorio-sustentabilidade-<cnpj>-<inicio>-<fim>.pdf`. |
| RF-07 | O botão mostra carregamento e, em erro, a mensagem no padrão atual sem baixar arquivo. |
| RNF-01 | Valores vindos da API são escapados antes de entrar no Markdown (um nome com `|` ou `*` não pode quebrar a tabela nem injetar HTML). |
| RNF-02 | Placeholder sem valor vira "—"; placeholder desconhecido no template falha nos testes, não em produção. |

## 4. Fora de escopo

- Geração no backend e armazenamento do PDF.
- Assinatura digital do documento.
