# Plano técnico — Gráfico de emissões por período

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Camadas (`features/dashboard`)

| Camada | Mudança |
|---|---|
| `domain/index.model.ts` | `MonthlyEmission = { month: string; co2Kg: number }`; `MonthRange = { from: string; to: string }`. |
| `domain/index.rules.ts` | `defaultRange(today)`, `validateRange(range)` (ordem e máximo de 24 meses), `periodVariation(series)` (% entre primeiro e último mês não nulo). |
| `infrastructure/index.dto.ts` | Schema Zod do array. |
| `infrastructure/index.repository.ts` | `loadEmissions(range)` → `GET /dashboard/emissions?from=&to=`. |
| `application/index.facade.ts` | Signals `range`, `emissions`, `emissionsLoading`, `emissionsError`; recarrega quando `range` muda e é válido. |
| `presentation/components/emission-line-chart` (novo) | SVG com eixo de meses, linha, pontos com `<title>` e tabela `visually-hidden`. |
| `presentation/pages/dashboard` | Filtro de meses + gráfico; título conforme o role. |

## 2. Testes

- Rules: intervalo padrão, validação, variação com zeros e série vazia.
- Facade: não chama a API com intervalo inválido.
- Componente: escala com todos os valores zero não divide por zero.
