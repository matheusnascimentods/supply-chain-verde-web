# Plano técnico: Cálculo de carbono

> Os requisitos estão em [`spec.md`](spec.md) e o passo a passo em [`tasks.md`](tasks.md).

## 1. Modelo e contrato (Task 1)

`domain/stage/index.model.ts`:

```ts
export const CALCULATION_METHODS = ['GHG_PROTOCOL', 'DEFRA'] as const;

/** Etapas que emitem pelo frete (RN-06 da API); as outras emitem pelo consumo no local (RN-08). */
export const isTransportStage = (stage: StageType): boolean => stage === 'TRANSPORT' || stage === 'DISTRIBUTION';

export const ENERGY_SOURCES = ['ELECTRICITY', 'DIESEL', 'LPG', 'NATURAL_GAS'] as const;
export type EnergySource = (typeof ENERGY_SOURCES)[number];
export const ENERGY_SOURCE_LABELS: Record<EnergySource, string> = {
  ELECTRICITY: 'Energia elétrica', DIESEL: 'Diesel', LPG: 'GLP', NATURAL_GAS: 'Gás natural',
};
export const ENERGY_SOURCE_UNITS: Record<EnergySource, string> = { ELECTRICITY: 'kWh', DIESEL: 'L', LPG: 'kg', NATURAL_GAS: 'm³' };

export interface EmissionFactor {
  calculationMethod: CalculationMethod;
  transportMode: TransportMode | null;
  fuelType: FuelType | null;
  energySource: EnergySource | null;
  value: number;
  unit: string;
  source: string;
  referenceYear: number;
}

/** O pedido de emissão: o peso só vale para deslocamento; fonte e consumo, para etapa fixa. */
export type NewEmission =
  | { calculationMethod: CalculationMethod; cargoWeightKg: number | null }
  | { calculationMethod: CalculationMethod; energySource: EnergySource; consumption: number };
```

`CarbonEmission` ganha `cargoWeightKg`, `energySource` e `consumption` (todos `| null`). No `index.dto.ts`, os campos novos são `.nullable().optional()`, porque as emissões antigas vêm sem eles. Há também o `emissionFactorSchema`.

`StagesRepository` passa a ter `listEmissionFactors(): Observable<EmissionFactor[]>` (`GET /emission-factors`) e `calculateEmission(chainId, emission: NewEmission)`. O corpo deixa de mandar `chainId`.

Tirar `IPCC` e `EMEP_EEA` do `z.enum` só é seguro depois que a `V22` da API estiver em produção. Antes dela, uma emissão antiga com `IPCC` quebraria a listagem de lotes.

## 2. Regras puras (Task 1)

Em `domain/index.rules.ts`, sem Angular e testadas em `index.rules.spec.ts`:

```ts
/** RN-07 da API: KG e TON dão o peso pela quantidade; nas outras unidades, o usuário informa. */
export function derivedCargoWeightKg(unit: ProductUnit | undefined, quantity: number): number | null {
  if (unit === 'KG') return quantity;
  if (unit === 'TON') return quantity * 1000;
  return null;
}

/** Metodologias com fator para a atividade (RN-04/RN-05 da API). */
export function methodsFor(factors: EmissionFactor[], activity: { transportMode: TransportMode; fuelType: FuelType } | { energySource: EnergySource }): CalculationMethod[] {
  const matches = (f: EmissionFactor) =>
    'energySource' in activity
      ? f.energySource === activity.energySource
      : f.transportMode === activity.transportMode && f.fuelType === activity.fuelType;
  return CALCULATION_METHODS.filter((method) => factors.some((f) => f.calculationMethod === method && matches(f)));
}

/** Combustíveis com fator em alguma metodologia para o modo (ex.: Aéreo → só querosene). */
export function fuelsFor(factors: EmissionFactor[], mode: TransportMode): FuelType[] {
  return FUEL_TYPES.filter((fuel) => factors.some((f) => f.transportMode === mode && f.fuelType === fuel));
}
```

Sem fatores carregados, as funções devolvem listas vazias, e o passo mostra a mensagem da RF-04.

## 3. Use case e facade (Task 2)

`StageSubmission.emissionMethod` vira `emission: NewEmission`, que é obrigatório. O `emission$` do `AdvanceStageUseCase` sempre roda (`progress.emissionSaved` ainda pula a chamada no retry). O `transport$` continua opcional: ele é nulo em etapa fixa e na emissão pendente de uma etapa que já tem transporte.

`AddStageFacade`:
- `loadChoices` carrega também `listEmissionFactors()` no mesmo `forkJoin`, e o resultado fica no sinal `factors`.
- `canCalculateEmission` sai da facade e o `@else` com o texto sai do modal (RF-08). Quem abre o modal já passou em `canAddStageTo`, que exige `admin`, `manager` ou `supplier`, exatamente os perfis do `canCalculateEmission`. A regra continua em `index.rules.ts`, usada pelo `canCalculatePendingEmission`.
- O erro do passo `emission` usa `apiErrorMessage(cause, FAILURE_MESSAGES.emission)` para mostrar o 400 ou 409 da API (RF-09).
- O novo `startPending(stage: Stage)` inicializa `progress = { chainId: stage.chainId, transportSaved: stage.transport !== null, emissionSaved: false }`. O `stage$` vira `EMPTY`, como no retry de hoje.

## 4. Modal (Task 2)

Entradas novas: `unit` (`facade.unitOf(batch)`, já calculado na lista), `quantity` e `pendingStage: Stage | null`.

Formulário:

```ts
transport: group({ transportMode, fuelType, distance, capacity, cargoWeightKg: [null, [required, POSITIVE]] }),
consumption: group({ energySource: ['', required], consumption: [null, [required, Validators.min(0)]] }),
calculationMethod: ['', required],
```

- Em etapa de deslocamento, o `consumption` fica desabilitado. Em etapa fixa, o `transport` fica desabilitado. Um grupo desabilitado não entra na validação, que é o padrão que o modal já usa.
- Se `derivedCargoWeightKg(unit, quantity)` não é nulo, o `cargoWeightKg` recebe esse valor e é desabilitado. O `getRawValue()` ainda o lê para a revisão, mas o pedido manda `null` (a API deriva o peso).
- `calculationMethod` é revalidado por `methodsFor`: se a metodologia escolhida sai da lista ao trocar modo, combustível ou fonte, o campo é limpo. A opção do `fuelType` vem de `fuelsFor`.
- `stepGroups` do passo **Emissão** passa a ser `[transport, consumption, calculationMethod]`, e o avanço valida os três (os desabilitados passam).
- A revisão mostra o fator escolhido (`factors().find(...)`) com o valor, a unidade, a fonte e o ano (RF-05).
- Com `pendingStage`, o modal começa no passo **Emissão**. O título vira "Calcular emissão" e os passos, `['Emissão', 'Revisão']`. Se a etapa já tem transporte, o grupo `transport` é preenchido com ele e só o `cargoWeightKg` fica editável (quando não é derivado). O submit chama `facade.startPending(stage)` antes do `submit`.

## 5. Card e lista (Task 3)

Regras (`domain/index.rules.ts`):

```ts
/** RN-11 da API: a última etapa sem emissão bloqueia a próxima. */
export const pendingEmissionStage = (batch: Batch): Stage | null => {
  const last = batch.stages.at(-1);
  return last && !last.emission ? last : null;
};

// RF-06: o dono da etapa pendente calcula, inclusive em lote Concluído (RN-13 da API).
export function canCalculatePendingEmission(role: Role, companyType: Company, batch: Batch): boolean {
  const stage = pendingEmissionStage(batch);
  return stage !== null && canCalculateEmission(role) && actsFor(stageOwner(stage.stageType), role, companyType);
}
```

`canAddStageTo` ganha `&& pendingEmissionStage(batch) === null` (RF-07).

- `BatchesFacade.canCalculatePendingEmission(batch)`, no mesmo padrão de `canAddStageTo`.
- `batch-card`: o input `canCalculateEmission` e o output `calculateEmission`, com o botão **Calcular emissão** ao lado de **Adicionar etapa**, na mesma classe.
- `pages/list`: o sinal `emissionBatch`. O `app-batch-stage-modal` recebe `[pendingStage]="pendingEmissionStage(batch)"` e reaproveita `(changed)="facade.load()"`.

## 6. Testes

- `index.rules.spec.ts`: `derivedCargoWeightKg` para as 5 unidades, `methodsFor` e `fuelsFor` com uma lista curta de fatores, `pendingEmissionStage` e a matriz de `canCalculatePendingEmission` (lado × perfil × status).
- `advance-stage/index.use-case.spec.ts`: a emissão sempre é chamada, e o retry com `emissionSaved` não chama de novo.
- `stage-modal/index.component.spec.ts`: o passo **Emissão** não avança sem os campos; com `TON`, o peso vem travado; no modo pendente, começa no passo **Emissão**.
- Cypress `register-batch-flow.cy.ts`: registrar a Produção com consumo e calcular a emissão pendente de um lote.
