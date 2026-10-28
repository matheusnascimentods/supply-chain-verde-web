# Tarefas — Hero section antes do login

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md); imagem em [`image-prompt.md`](image-prompt.md).

**Status:** planejado, nada implementado. Não depende da API.

---

## Task 1 — `chore/landing-hero-assets`

- [ ] Gerar a imagem com o prompt de [`image-prompt.md`](image-prompt.md) §2/§3 e passar pelo checklist (§5)
- [ ] Recortar o contêiner (§4) no mesmo tamanho de tela do fundo
- [ ] Exportar para `public/landing/` nos tamanhos e formatos do plan §5
- [ ] Registrar aqui o gerador usado, o prompt final e a seed (se houver)

**Pronto:** os arquivos estão em `public/landing/` e o fundo 1920 tem no máximo 250 KB.

## Task 2 — `feat/landing-hero`

- [ ] `features/landing` com rota e página (plan §2)
- [ ] Camadas fundo → "VERDE" → recorte → conteúdo (plan §3)
- [ ] Card de vidro e CTA **Entrar** (plan §4)
- [ ] Layout mobile (spec RF-06) e animação com `prefers-reduced-motion`
- [ ] `guestGuard` + troca da rota `''` em `app.routes.ts` (plan §1)
- [ ] `showFooter` falso em `/`
- [ ] Testes do plan §6; ajustar `cypress/e2e/login.cy.ts`

**Pronto:** `npm test` e `npm run cypress:run` verdes; Lighthouse mobile com LCP ≤ 2,5 s e acessibilidade ≥ 95; layout conferido de 375px a 2560px.

## Task 3 — `docs/landing-hero`

- [ ] Captura `00-landing.jpeg` em `docs/screenshots/` e menção no README
- [ ] Marcar o status desta feature como concluído
