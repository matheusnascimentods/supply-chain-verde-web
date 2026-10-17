# Tarefas — Ajustes ao contrato novo da API

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** concluída. Tasks 1 (#66), 2 (#67), 3 (#68), 4 (#69) e 5 entregues; `npm test` e `npm run cypress:run` verdes. Depende da API já mergeada: PR #66 (views e procedures) e PR #67 (ordem das etapas).

**Ordem sugerida:** Task 1 primeiro, porque as outras usam o utilitário de data e o `apiErrorMessage`. Depois disso, as Tasks 2, 3 e 4 são independentes e podem virar PRs separados. A Task 5 é verificação e fecha a feature.

**Antes de começar:** a API local precisa estar com as migrations V36–V39 (banco recriado com a imagem `docker/postgres`; ver README da API). Sem isso, as regras novas não existem e os testes manuais não reproduzem nada.

---

## Task 1 — `refactor/shared-local-date`

Base comum, sem mudança de comportamento.

- [x] Criar `shared/utils/date/index.utils.ts` com `localDateDaysAgo`, movido de `features/audit-log/application/index.facade.ts`
- [x] A auditoria passa a importar do utilitário; nenhum outro uso muda
- [x] Mover os testes existentes para `shared/utils/date/index.utils.spec.ts` e incluir o caso `localDateDaysAgo(0)` = hoje local
- [x] `npm test` verde; a tela de auditoria abre com o mesmo período padrão

**Pronto:** `localDateDaysAgo` só existe em `shared/utils/date`.

## Task 2 — `feat/certification-expiry-rules` (RF-01, RF-02, RF-03)

### Formulário de nova certificação
- [x] Validators `notBefore(hoje)` e `notBeforeField('issuedAt')` em `expiresAt`
- [x] `[min]` no `<input type="date">` de validade (emissão ou hoje, o que for maior)
- [x] Mudança em `issuedAt` revalida `expiresAt`
- [x] `fieldError('expiresAt')` com as três mensagens (obrigatório, passado, antes da emissão)
- [x] Erro do envio via `apiErrorMessage` com o fallback atual
- [x] Specs: ontem bloqueia sem chamar o use-case; antes da emissão bloqueia; hoje envia; 400 mostra a mensagem da API

### Menu de status
- [x] `isExpired(item)` com a data local de hoje
- [x] "Ativa" com `disabled` e `aria-describedby` apontando para a dica "Vencida em …: não pode voltar a ficar ativa."
- [x] `handleStatusMenuKeydown` ignora opções desabilitadas nas setas, `Home` e `End`
- [x] `setStatus` recusa `ACTIVE` em vencida (defesa) e usa `apiErrorMessage` no erro
- [x] Specs: desabilitada só em vencida; navegação pula a opção; 400 mostra a mensagem da API

### Verificação manual
- [x] Cadastrar certificação com validade ontem → erro no campo, nenhuma requisição na aba Network
- [x] Forçar a requisição (validade ontem via DevTools) → mensagem "Não é possível cadastrar uma certificação já vencida."
- [x] Certificação `EXPIRED` vencida: "Ativa" desabilitada com a dica; "Suspensa" e "Em análise" continuam disponíveis

**Pronto:** não há caminho pela tela que gere o 400 de certificação; se ele vier, aparece a mensagem da API.

## Task 3 — `feat/report-snapshot-notice` (RF-03, RF-04)

- [x] `report/index.facade.ts`: `saveError` via `apiErrorMessage` com o fallback atual
- [x] Aviso de retrato abaixo do botão "Gerar relatório"
- [x] "Retrato desta data" junto da data de geração em cada card
- [x] Frase de retrato no `report-pdf/index.template.md`, logo abaixo da data de geração
- [x] Specs: facade (400 → mensagem da API; 500 → fallback); modal (aviso no formulário e no card); PDF (frase no Markdown)

### Verificação manual
- [x] Gerar relatório de um fornecedor com emissões → card mostra CO₂ diferente de zero e o aviso
- [x] Baixar o PDF → frase de retrato logo abaixo da data de geração
- [x] Período com fim antes do início → mensagem local atual (a validação do formulário continua antes da API)

**Pronto:** quem gera ou lê um relatório sabe que ele não se atualiza sozinho.

## Task 4 — `feat/stage-next-only` (RF-03, RF-05, RF-06)

### Domínio
- [x] `nextStage(current)` em `batches/domain/stage/index.model.ts`
- [x] `canAddStageTo` usa `nextStage(...) !== null`
- [x] Specs (criar `batches/domain/stage/index.model.spec.ts`): `nextStage` para `null`, cada etapa e `RETAIL`; casos atuais de `canAddStageTo` seguem verdes

### Modal de etapa
- [x] Entrada `currentStage` no `BatchStageModalComponent`
- [x] Lista de lotes passa `[currentStage]="batch.currentStage"`
- [x] `stageType` preenchido com `nextStage(currentStage())` no `ngOnInit`; `requireTransport` disparado quando for `TRANSPORT`
- [x] Seletor trocado por texto fixo com a etapa e a ordem completa da cadeia
- [x] Erro do passo `stage` no `AddStageFacade` via `apiErrorMessage(error, FAILURE_MESSAGES.stage)`; mensagens de `transport` e `emission` inalteradas
- [x] Specs: lote vazio → Produção; `PROCESSING` → Transporte com campos obrigatórios; `submit` envia a etapa calculada; 400 → mensagem da API

### Verificação manual
- [x] Lote recém-criado → modal mostra "Produção"
- [x] Lote em "Processamento" → modal mostra "Transporte" e exige modal, distância, combustível e capacidade
- [x] Lote em "Varejo" → botão "Adicionar etapa" não aparece (já é o comportamento atual)
- [x] Duas abas registrando a mesma etapa ao mesmo tempo → a segunda mostra "Transição de etapa inválida: …" da API

**Pronto:** o usuário não consegue escolher uma etapa que a API recusaria.

## Task 5 — `test/stages-without-data` (RF-07)

Verificação das etapas inseridas pela V39 da API. Só vira mudança de código se algo quebrar.

- [x] Spec da jornada pública com uma etapa sem endereço, transporte e emissão
- [x] Spec do `batch-card` com a primeira etapa sem origem → rota começa no nome do fornecedor
- [x] Spec do `carbon-chart` com uma etapa sem emissão → sem erro e sem barra para essa etapa
- [x] Conferir na tela um lote dos seeds que começava em "Processamento": a jornada mostra "Produção" e "Armazenagem" inseridas, com "Origem não informada"
- [x] Se o resultado visual não for aceitável (ex.: muitas etapas "vazias" na jornada), abrir uma tarefa à parte para decidir como exibi-las; não resolver aqui — conferido no lote #5: aceitável, sem tarefa à parte

**Pronto:** as etapas sem dados aparecem sem erro em todas as telas que listam etapas.

---

**Feature pronta quando:** as cinco tasks estiverem fechadas, `npm test` e `npm run cypress:run` verdes, e um roteiro manual completo (certificação → relatório → etapa) feito contra a API local com V36–V39 sem cair em mensagem genérica de erro.
