# Tarefas — Hero section antes do login

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md); imagem em [`image-prompt.md`](image-prompt.md).

**Status:** Task 1 concluída; Tasks 2 e 3 pendentes. Não depende da API.

---

## Task 1 — `chore/landing-hero-assets`

- [x] Gerar a imagem com o prompt de [`image-prompt.md`](image-prompt.md) §2/§3 e passar pelo checklist (§5)
- [x] Exportar `public/landing/hero-bg.avif` conforme o plan §5
- [ ] Registrar aqui o gerador usado, o prompt final e a seed (se houver)

**Pronto:** `public/landing/hero-bg.avif` existe em 16:9 com no máximo 250 KB.

**Feito:**
- A primeira geração (prompt antigo) saiu com contêiner pequeno, pilha distante e cipós pendurados. O prompt foi reescrito para se aproximar da referência, e a imagem final saiu do prompt novo.
- O recorte do contêiner (efeito de profundidade) ficou para depois: spec RF-05 e plan §3.
- Arquivo final: `hero-bg.avif`, 1672×941, 110 KB. Ficou na resolução nativa do gerador, sem upscale; se ficar borrado em telas grandes, fazer upscale para 1920×1080.

## Task 2 — `feat/landing-hero`

- [ ] `features/landing` com rota e página (plan §2)
- [ ] Camadas fundo → "VERDE" → conteúdo (plan §3)
- [ ] Card de vidro e CTA **Entrar** (plan §4)
- [ ] Layout mobile (spec RF-06) e animação com `prefers-reduced-motion`
- [ ] `guestGuard` + troca da rota `''` em `app.routes.ts` (plan §1)
- [ ] `showFooter` falso em `/`
- [ ] Testes do plan §6; ajustar `cypress/e2e/login.cy.ts`

**Pronto:** `npm test` e `npm run cypress:run` verdes; Lighthouse mobile com LCP ≤ 2,5 s e acessibilidade ≥ 95; layout conferido de 375px a 2560px.

## Task 3 — `docs/landing-hero`

- [ ] Captura `00-landing.jpeg` em `docs/screenshots/` e menção no README
- [ ] Marcar o status desta feature como concluído
