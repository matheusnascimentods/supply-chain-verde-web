# Especificação — Gráfico de emissões por período

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato da API: `supply-chain-verde-api/docs/grafico-emissoes/spec.md`.

## 1. Problema

A A3 pede impacto mensurável. O dashboard mostra a emissão do mês corrente, mas não a tendência.

## 2. Objetivo

Gráfico de linha da emissão de CO₂ mês a mês no dashboard, com intervalo escolhido pelo usuário.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | Gráfico de linha no dashboard, para todos os roles, com dados de `GET /dashboard/emissions`. |
| RF-02 | Dois campos `input type="month"` (de/até). Padrão: últimos 12 meses. |
| RF-03 | O escopo vem da API: `supplier` vê só as próprias emissões; o título indica isso ("Suas emissões" × "Emissões da cadeia"). |
| RF-04 | Intervalo inválido (de > até, mais de 24 meses) é bloqueado no front com mensagem, sem chamar a API. |
| RF-05 | Tooltip/rótulo por ponto com mês e valor em kg CO₂e; variação entre o primeiro e o último mês exibida abaixo do gráfico (ex.: "−30,4% no período"). |
| RF-06 | Estados de carregando, erro e "sem emissões no período". |
| RNF-01 | Sem biblioteca de gráficos: SVG próprio, no mesmo padrão dos gráficos de etapa do dashboard. |
| RNF-02 | Acessível: `role="img"` com `aria-label` resumindo a série e tabela oculta com os valores. |
