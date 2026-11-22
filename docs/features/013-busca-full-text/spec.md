# Especificação — Busca full text

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato e regras da API: `supply-chain-verde-api/docs/features/014-busca-full-text/spec.md`.

## 1. Problema

As searchbars demoram a "achar" o termo. A causa está na API, que é sensível a acento, descarta termos com menos de 3 letras e usa `LIKE` em CNPJ e email. O front já manda o termo como o usuário digitou (só com `trim`) e com debounce, então não descarta nada por conta própria.

## 2. Objetivo

Depois da API 014, toda searchbar acha o termo desde a 1ª letra, sem depender de acento nem de maiúscula, sem nenhuma mudança de lógica no front.

## 3. Searchbars

| Tela | Componente | Parâmetro | Passa a achar |
|---|---|---|---|
| Produtos | `products/presentation/pages/list` (`#products-search`) | `search` | "graos", "c", "têxtil" |
| Fornecedores | `suppliers/presentation/pages/list` (`#supplier-search`) | `search` | "com", "12.345" (início do CNPJ) |
| Pedido de lote | `batches/presentation/components/create-modal` (`#batch-supplier-search`; na feature 014 vira a busca de produto) | `search` | idem |
| Usuários | `users/presentation/pages/list` (`#users-email-search`) | `email` | "KANE", "bayern" |
| Auditoria | `audit-log/presentation/pages/audit-log` (`#audit-email`) | `userEmail` | idem |
| Exportação da auditoria | `audit-log/presentation/components/export-modal` (`#export-email`) | `userEmail` | idem |

## 4. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | Nenhuma searchbar bloqueia, descarta ou exige tamanho mínimo de termo. O front manda o termo como digitado (`trim`). |
| RF-02 | Os textos das searchbars não prometem o que a API não faz. Busca por trecho do meio da palavra não é prometida (API RN-01). CNPJ casa pelo início (API RN-04). |

## 5. Fora do escopo

- Destacar no resultado o trecho que casou.
- Mudar o debounce (250 ms no `PagedSearch`, 300 ms nas listas).
- Testes e2e da semântica de busca: o Cypress usa `cy.intercept`, então não chega ao MySQL. Quem prova a semântica é o `FullTextSearchIT` da API.

## 6. Critérios de aceite

Contra a API local com a 014 concluída:

- Cada searchbar da §3 acha o exemplo da coluna "Passa a achar".
- Digitar "c" já filtra a lista, em vez de mostrar "Nenhum ... encontrado".
