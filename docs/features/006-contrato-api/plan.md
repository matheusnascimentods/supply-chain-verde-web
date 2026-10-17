# Plano técnico — Ajustes ao contrato novo da API

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Ideia geral

As três regras novas já estão no servidor, então o frontend não precisa reimplementá-las por completo. Duas camadas bastam:

1. **Prevenção:** derivar da informação já carregada o que é permitido (próxima etapa, certificação vencida) e não oferecer o resto.
2. **Mensagem da API:** em qualquer recusa que escape, mostrar o motivo vindo do servidor.

Nada de chamada nova, estado novo no backend ou biblioteca nova.

## 2. Utilitários compartilhados

| O quê | Onde | Como |
|---|---|---|
| Data local de hoje | `shared/utils/date/index.utils.ts` | Mover para cá o `localDateDaysAgo` de `features/audit-log/application/index.facade.ts` e reaproveitar: hoje = `localDateDaysAgo(0)`. A auditoria passa a importar daqui. Fica uma função só, com o mesmo cuidado de fuso que já existe. |
| Mensagem de erro | `shared/utils/http/index.utils.ts` | Já existe: `apiErrorMessage(error, fallback)` devolve `error.message` em 400/409 e o fallback nos outros casos. Só passa a ser usado nos quatro fluxos. |

## 3. Certificações (RF-01, RF-02, RF-03)

### 3.1 Formulário — `certifications/presentation/components/form`

```ts
readonly today = localDateDaysAgo(0);

readonly form = this.fb.nonNullable.group({
  // ...
  expiresAt: ['', [Validators.required, notBefore(() => this.today), notBeforeField('issuedAt')]],
});
```

- `notBefore` e `notBeforeField` são validators pequenos no próprio componente. Comparam strings `yyyy-MM-dd`, que ordenam como data, então não precisam de `Date`.
- O template ganha `[min]="form.controls.issuedAt.value || today"` no `<input type="date">` de validade. Isso ajuda o seletor nativo, mas não substitui o validator: digitar a data à mão também precisa falhar.
- `fieldError('expiresAt')` passa a distinguir as três mensagens: obrigatório, "A validade não pode estar no passado." e "A validade deve ser igual ou posterior à emissão."
- Mudar `issuedAt` revalida `expiresAt` (`valueChanges` → `updateValueAndValidity`).
- No `error` do `subscribe`: `this.error.set(apiErrorMessage(err, 'Não foi possível salvar. Confira os dados e tente novamente.'))`.

### 3.2 Menu de status — `suppliers/presentation/components/certifications-modal`

```ts
protected isExpired(item: SupplierCertification): boolean {
  return item.expiresAt < this.today;
}
```

```html
<button ... role="menuitemradio"
        [disabled]="updatingStatusId() === item.certificationId || (status === 'ACTIVE' && isExpired(item))"
        [attr.aria-describedby]="status === 'ACTIVE' && isExpired(item) ? 'expired-hint-' + item.certificationId : null">
```

- Um `<span id="expired-hint-{id}">` visível no card explica "Vencida em dd/MM/yyyy: não pode voltar a ficar ativa."
- `handleStatusMenuKeydown` passa a pular os botões `disabled` ao navegar com as setas. Hoje ele foca todos os `[role="menuitemradio"]`, então o filtro entra em `options`.
- `setStatus` guarda a mesma condição, por defesa, e usa `apiErrorMessage` no erro.

## 4. Relatórios (RF-03, RF-04)

| Ponto | Mudança |
|---|---|
| `suppliers/application/report/index.facade.ts` | `saveError.set(apiErrorMessage(err, 'Não foi possível gerar o relatório. Confira o período e tente novamente.'))`. |
| `reports-modal/index.component.html` | Abaixo do botão "Gerar relatório": `<p class="reports-hint">Retrato da data de geração. Dados lançados depois exigem gerar um novo relatório.</p>`. No card, junto de "Data de geração", a mesma ideia curta: "Retrato desta data". |
| `report-pdf/index.template.md` | Depois de `**Relatório nº {{reportId}}** · gerado em {{generatedAt}}`: `*Retrato dos dados na data de geração. Lançamentos posteriores não alteram este relatório.*` Como é texto fixo, não precisa de placeholder. |
| Specs | O snapshot/expectativa do mapper e do template do PDF ganham a frase; os fixtures que usam `trackedProductCount: 0` ou nulo não precisam mudar, porque o tipo continua igual. |

## 5. Etapas (RF-03, RF-05, RF-06, RF-07)

### 5.1 Domínio — `batches/domain/stage/index.model.ts`

```ts
/** Próxima etapa da sequência obrigatória (mesma ordem do enum StageType da API); null depois de RETAIL. */
export function nextStage(current: StageType | null): StageType | null {
  if (current === null) return 'PRODUCTION';
  return STAGE_TYPES[STAGE_TYPES.indexOf(current) + 1] ?? null;
}
```

`canAddStageTo` (em `index.rules.ts`) passa a usar `nextStage(batch.currentStage) !== null` em vez de comparar com `'RETAIL'`. A regra continua a mesma e a sequência fica num lugar só.

### 5.2 Modal — `batches/presentation/components/stage-modal`

- Nova entrada `readonly currentStage = input<StageType | null>(null);`.
- `nextStage(currentStage())` preenche o `stageType` no `ngOnInit` (o `input` já está disponível ali) e dispara `requireTransport` quando a próxima é `TRANSPORT`.
- O `<select>` de tipo é trocado por um texto fixo com a etapa e a explicação. O `formControlName="stageType"` continua no formulário, com o valor preenchido, para o `submit` não mudar:

```html
<div class="stage-field">
  Tipo da etapa
  <p class="stage-next" id="stage-next">{{ stageTypeLabels[form.controls.stageType.value] }}</p>
  <span class="stage-hint">As etapas seguem a ordem da cadeia: {{ orderLabel }}.</span>
</div>
```

- `orderLabel` = `STAGE_TYPES.map(type => STAGE_TYPE_LABELS[type]).join(' → ')`.
- `batches/presentation/pages/list/index.component.html` passa `[currentStage]="batch.currentStage"`.
- `add-stage/index.facade.ts`: no passo `stage`, o erro usa `apiErrorMessage(error, FAILURE_MESSAGES.stage)`. Os passos `transport` e `emission` mantêm as mensagens próprias, que dizem que a etapa já foi salva.

### 5.3 Etapas sem dados (RF-07)

Já tratado pelos templates; só falta confirmar e cobrir com spec:

| Tela | Comportamento esperado |
|---|---|
| Jornada pública (`traceability`) | "Origem não informada", sem linha de transporte e sem linha de emissão. |
| `batch-card` | `routeOrigin()` cai no nome do fornecedor quando a primeira etapa não tem origem. **Muda o que aparece** nos lotes que começavam em "Processamento": agora a primeira etapa é a "Produção" inserida, sem endereço. |
| `carbon-chart` | Etapa sem emissão não vira barra zerada nem quebra a escala. Confirmar com um spec com uma etapa sem `emission`. |

## 6. Testes

| Spec | Casos |
|---|---|
| `shared/utils/date/index.utils.spec.ts` (novo) | Os casos atuais de `localDateDaysAgo` migram da auditoria; `0` devolve a data local de hoje. |
| `certifications/.../form/index.component.spec.ts` | validade ontem → erro e sem chamada; validade antes da emissão → erro; hoje → envia; 400 da API → mostra a mensagem dela. |
| `suppliers/.../certifications-modal/index.component.spec.ts` | "Ativa" desabilitada só em vencida; setas pulam a opção desabilitada; 400 → mensagem da API. |
| `suppliers/application/report/index.facade.spec.ts` | 400 → `saveError` com a mensagem da API; 500 → fallback atual. |
| `suppliers/.../reports-modal/index.component.spec.ts` | aviso de retrato visível no formulário e no card. |
| `suppliers/infrastructure/report-pdf/*.spec.ts` | frase de retrato no Markdown gerado. |
| `batches/domain/stage/index.model.spec.ts` (novo) | `nextStage(null) = PRODUCTION`, cada etapa → a seguinte, `RETAIL` → `null`. |
| `batches/domain/index.rules.spec.ts` | casos atuais de `canAddStageTo` continuam passando. |
| `batches/.../stage-modal/index.component.spec.ts` | lote vazio → "Produção"; `PROCESSING` → "Transporte" e campos de transporte obrigatórios; o `submit` envia a etapa calculada; 400 → mensagem da API. |
| `batches/application/add-stage/index.facade.spec.ts` | 400 no passo `stage` → mensagem da API; falha em `transport`/`emission` mantém as mensagens atuais. |
| `traceability` e `batch-card` | etapa sem endereço, transporte e emissão renderiza sem erro. |

Cypress: `register-batch-flow.cy.ts` usa stubs e não registra etapa; não muda.
