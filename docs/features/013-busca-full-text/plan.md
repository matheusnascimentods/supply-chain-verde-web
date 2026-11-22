# Plano técnico — Busca full text

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. O que muda no front

Nada na lógica. As searchbars já fazem o que a API espera:

- `PagedSearch` (`batches/application/paged-search/index.helper.ts`): `trim`, `debounceTime(250)`, `distinctUntilChanged` e `switchMap` (a última busca cancela a anterior);
- `ProductsList`, `SuppliersFacade`, `UsersList`, `AuditLog`: `trim` + `debounceTime(300)`, e o parâmetro só é enviado quando não está vazio.

Nenhum desses pontos corta termo curto, então a RF-01 já vale. A task confere isso com um `grep` e não altera código.

## 2. Textos (RF-02)

| Searchbar | Hoje | Ajuste |
|---|---|---|
| `#supplier-search` | label "Buscar por nome ou CNPJ" | placeholder "Nome ou início do CNPJ" |
| `#products-search` | "Buscar por nome, descrição ou categoria" | nenhum |
| `#users-email-search`, `#audit-email`, `#export-email` | "Buscar por email" | nenhum |

Se algum spec ou teste Cypress procura o placeholder antigo, ele é atualizado junto.

## 3. Verificação manual

Com a API 014 no compose local (`docker compose up` na API) e `npm start`:

1. **Produtos** (fornecedor logado): "graos", "c", "têxtil".
2. **Fornecedores** (mercado logado): "com", "12.345" (início de um CNPJ do seed).
3. **Usuários**: "KANE". **Auditoria** e **Exportação**: "bayern".
4. Em todas: digitar "c" já filtra.
