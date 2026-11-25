# Plano técnico: Endereços das etapas do lote

> Os requisitos estão em [`spec.md`](spec.md) e o passo a passo em [`tasks.md`](tasks.md).

## 1. Modelo e contrato (Task 1)

`batches/domain/stage/index.model.ts`:

```ts
export interface NewStageAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement: string | null;
  zipCode: string;
  city: string;
  state: string;
}

export interface NewStage {
  stageType: StageType;
  startedAt: string;
  endedAt: string | null;
  destination: NewStageAddress | null; // null só no RETAIL (RN-03 da API)
}
```

`StageRepository.create` continua espalhando `...stage` no body, então não muda. O `stageResponseSchema` também não muda, porque `originAddress` e `destinationAddress` continuam `nullable` e etapas legadas podem ter destino nulo até a API Task 2.

## 2. Facade: companhia em vez do catálogo (Task 1)

O `AddStageFacade` carregava fornecedores só para montar os selects. Agora ele precisa de outra coisa: o endereço da **própria companhia** de quem está logado. É a origem da Produção (para o fornecedor) e o destino do Varejo (para o mercado). Como `GET /companies/me` é `authenticated()` na API, serve para os dois lados.

```ts
readonly ownAddress = signal<StageAddress | null>(null);

private loadChoices(): void {
  forkJoin({ user: this.currentUser.load(), company: this.profile.getMyCompany() }).subscribe({
    next: ({ user, company }) => {
      this.responsibleUserId = user.userId;
      this.ownAddress.set(company.address);
      this.loadingChoices.set(false);
    },
    error: () => { /* mensagem atual */ },
  });
}
```

- Saem `addresses`, `AddressOption`, `toAddressOptions`, a injeção de `SuppliersRepository` e o `if supplier` com o `throwError`.
- O `ProfileRepository` precisa ser exportado pelo `features/profile/index.ts`, do mesmo jeito que `SuppliersRepository` sai de `features/suppliers`.

## 3. Modal (Task 1)

**Origem.** A lista passa a origem da próxima etapa como input:

```html
<app-batch-stage-modal [batchId]="batch.batchId" [currentStage]="batch.currentStage"
  [origin]="batch.stages.at(-1)?.destinationAddress ?? null" ... />
```

No modal: `originLabel = computed(() => placeLabel(this.origin() ?? this.facade.ownAddress()))`. O `?? ownAddress` só se aplica quando não há etapas, porque aí a próxima etapa é a Produção e quem registra é o fornecedor (RN-04).

**Destino.** O form ganha um grupo aninhado, e `originAddressId`/`destinationAddressId` saem:

```ts
destination: fb.nonNullable.group({
  zipCode: ['', Validators.required], state: ['', Validators.required], street: ['', Validators.required],
  number: ['', Validators.required], neighborhood: ['', Validators.required], complement: [''], city: ['', Validators.required],
}),
```

- No `ngOnInit`, se a próxima etapa for `RETAIL`, chama `form.controls.destination.disable()`. O grupo desabilitado não conta na validação, e o `submit` manda `destination: null`.
- Busca de CEP: `lookUpCompanyZipCode(this.form.controls.destination)` no construtor. A função já recebe qualquer form com `controls.zipCode` e `patchValue`.
- Máscara do CEP: o `formatCompanyFieldsWhileTyping` exige `cnpj` e `phone`. Extrair do `company-fields/index.helper.ts` um `formatZipCodeWhileTyping(control)` e fazer o `formatCompanyFieldsWhileTyping` usá-lo. A diff é pequena, e o helper continua sendo o único lugar com essa regra.
- No `submit`, `zipCode` vai com `digitsOnly` (como no cadastro), `state` com `toUpperCase()` e `complement` vazio como `null`.

**Template.** Os dois `fieldset` com `select` saem. Entram:

- `<p class="stage-origin">Origem: {{ originLabel() }}</p>`;
- no Varejo, `<p>Destino: {{ placeLabel(facade.ownAddress()) }}</p>`;
- nas outras etapas, `<fieldset formGroupName="destination">` com os `app-text-field` do `sign-up` (mesmos ids e atributos `autocomplete`, com o prefixo `stage-dest-`) e a linha de status do CEP.

`placeLabel(address)`: `"<street>, <number> – <city>/<state>"`, ou "Endereço não informado" quando for nulo. Fica em `batches/domain/stage/index.model.ts`, ao lado de `StageAddress`, e o `batch-card` continua com o `addressLabel` dele (cidade, UF), que é outro formato.

## 4. Testes

- `add-stage/index.facade.spec.ts`: carrega `getMyCompany` e preenche `ownAddress`. Não chama mais `SuppliersRepository`.
- `stage-modal/index.component.spec.ts`:
  - Sem etapas, a origem é o endereço da companhia. Com `origin` no input, mostra o input.
  - Destino incompleto bloqueia o submit.
  - Submit envia `destination` com CEP só em dígitos e UF em maiúsculas.
  - No `RETAIL`, o form de destino não aparece e o submit envia `destination: null`.
- `company-fields`: o spec existente continua verde depois da extração do `formatZipCodeWhileTyping`.
- `cypress/e2e/register-batch-flow.cy.ts`: preenche o destino nas etapas do fornecedor e confere o destino do Varejo no card.
