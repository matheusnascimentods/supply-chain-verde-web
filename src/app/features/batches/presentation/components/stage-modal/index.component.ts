import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { StepperComponent } from '../../../../../shared/ui/stepper/index.component';
import { formatZipCodeWhileTyping, lookUpCompanyZipCode } from '../../../../../shared/forms/company-fields/index.helper';
import { digitsOnly, formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import type { ProductUnit } from '../../../../products';
import { AddStageFacade } from '../../../application/add-stage/index.facade';
import { derivedCargoWeightKg, fuelsFor, methodsFor } from '../../../domain/index.rules';
import {
  CALCULATION_METHOD_LABELS,
  CalculationMethod,
  ENERGY_SOURCES,
  ENERGY_SOURCE_LABELS,
  ENERGY_SOURCE_UNITS,
  EmissionFactor,
  EnergySource,
  FUEL_TYPE_LABELS,
  FuelType,
  NewEmission,
  NewStageAddress,
  NewTransport,
  STAGE_TYPES,
  STAGE_TYPE_LABELS,
  Stage,
  StageAddress,
  StageType,
  TRANSPORT_MODES,
  TRANSPORT_MODE_LABELS,
  TransportMode,
  isTransportStage,
  nextStage,
  placeLabel,
} from '../../../domain/stage/index.model';

const POSITIVE = Validators.min(0.000001);
const ROUTE = 'Origem e destino';
const EMISSION = 'Emissão';
const REVIEW = 'Revisão';

@Component({
  selector: 'app-batch-stage-modal',
  imports: [ReactiveFormsModule, ModalComponent, StepperComponent],
  providers: [AddStageFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchStageModalComponent implements OnInit {
  protected readonly facade = inject(AddStageFacade);
  protected readonly orderLabel = STAGE_TYPES.map((type) => STAGE_TYPE_LABELS[type]).join(' → ');
  protected steps = [ROUTE, EMISSION, REVIEW];
  readonly step = signal(0);
  protected stageLabel = '';
  protected readonly transportModes = TRANSPORT_MODES;
  protected readonly transportModeLabels: Readonly<Record<string, string>> = TRANSPORT_MODE_LABELS;
  protected readonly fuelTypeLabels: Readonly<Record<string, string>> = FUEL_TYPE_LABELS;
  protected readonly energySources = ENERGY_SOURCES;
  protected readonly energySourceLabels: Readonly<Record<string, string>> = ENERGY_SOURCE_LABELS;
  protected readonly energySourceUnits: Readonly<Record<string, string>> = ENERGY_SOURCE_UNITS;
  protected readonly calculationMethodLabels: Readonly<Record<string, string>> = CALCULATION_METHOD_LABELS;
  protected readonly placeLabel = placeLabel;
  protected readonly formatNumber = (value: number) => formatNumberBr(value, 6);

  readonly batchId = input.required<number>();
  readonly currentStage = input<StageType | null>(null);
  /** Destino da última etapa do lote; null antes da Produção, quando a origem é a própria companhia (RN-04 da API). */
  readonly origin = input<StageAddress | null>(null);
  readonly unit = input<ProductUnit | undefined>(undefined);
  readonly quantity = input(0);
  /** Última etapa sem emissão (RF-06): o modal só calcula a emissão dela. */
  readonly pendingStage = input<Stage | null>(null);
  readonly dismiss = output<void>();
  readonly created = output<void>();
  readonly changed = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');
  readonly form = this.fb.group({
    stageType: ['', Validators.required],
    destination: this.fb.nonNullable.group({
      zipCode: ['', Validators.required],
      state: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      complement: [''],
      city: ['', Validators.required],
    }),
    // Só um dos dois grupos fica habilitado (RF-02/RF-03): grupo desabilitado não entra na validação.
    transport: this.fb.group({
      transportMode: ['', Validators.required],
      distance: [null as number | null, [Validators.required, POSITIVE]],
      fuelType: ['', Validators.required],
      capacity: [null as number | null, [Validators.required, POSITIVE]],
      cargoWeightKg: [null as number | null, [Validators.required, POSITIVE]],
    }),
    consumption: this.fb.group({
      energySource: ['', Validators.required],
      consumption: [null as number | null, [Validators.required, Validators.min(0)]],
    }),
    calculationMethod: ['', Validators.required],
  });

  protected readonly originLabel = computed(() => placeLabel(this.origin() ?? this.facade.ownAddress()));
  protected readonly marketLabel = computed(() => placeLabel(this.facade.ownAddress()));
  protected readonly zipCodeLookup = lookUpCompanyZipCode(this.form.controls.destination);
  protected isRetail = false;
  protected isPending = false;
  /** Controles validados ao avançar de cada passo; a revisão não tem campos. */
  private readonly stepControls: Record<string, AbstractControl[]> = {
    [ROUTE]: [this.form.controls.destination],
    [EMISSION]: [this.form.controls.transport, this.form.controls.consumption, this.form.controls.calculationMethod],
  };

  constructor() {
    formatZipCodeWhileTyping(this.form.controls.destination.controls.zipCode);
    // RF-04: ao trocar modo, combustível ou fonte, some a escolha que deixou de ter fator.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.dropUnavailableChoices());
  }

  ngOnInit(): void {
    const pending = this.pendingStage();
    this.isPending = pending !== null;
    // A API só aceita a próxima etapa da sequência.
    const stage = pending?.stageType ?? nextStage(this.currentStage());
    this.stageLabel = stage ? STAGE_TYPE_LABELS[stage] : '';
    this.form.controls.stageType.setValue(stage ?? '');
    // O varejo termina no endereço do mercado (RN-03 da API): o grupo desabilitado sai da validação.
    this.isRetail = stage === 'RETAIL';
    if (this.isRetail || pending) this.form.controls.destination.disable();
    if (this.isTransport) this.form.controls.consumption.disable();
    else this.form.controls.transport.disable();

    const cargo = this.form.controls.transport.controls.cargoWeightKg;
    const derived = derivedCargoWeightKg(this.unit(), this.quantity());
    if (derived !== null) {
      cargo.setValue(derived);
      cargo.disable();
    }

    if (pending) {
      this.steps = [EMISSION, REVIEW];
      this.facade.startPending(pending);
      if (pending.transport && this.isTransport) {
        const { transportMode, distance, fuelType, capacity } = pending.transport;
        const transport = this.form.controls.transport;
        transport.patchValue({ transportMode, distance, fuelType, capacity });
        for (const name of ['transportMode', 'distance', 'fuelType', 'capacity'] as const) transport.controls[name].disable();
      }
    }
  }

  protected get destination() {
    return this.form.controls.destination;
  }

  protected get transportGroup() {
    return this.form.controls.transport;
  }

  protected get consumptionGroup() {
    return this.form.controls.consumption;
  }

  protected get stepName(): string {
    return this.steps[this.step()];
  }

  get isTransport(): boolean {
    const stage = this.form.controls.stageType.value;
    return !!stage && isTransportStage(stage as StageType);
  }

  protected get cargoDerived(): boolean {
    return this.transportGroup.controls.cargoWeightKg.disabled;
  }

  /** Combustíveis com fator para o modo escolhido (RF-04). */
  protected fuels(): FuelType[] {
    const mode = this.transportGroup.controls.transportMode.value;
    return mode ? fuelsFor(this.facade.factors(), mode as TransportMode) : [];
  }

  /** Metodologias com fator para a atividade escolhida; vazia enquanto a atividade não está completa (RF-04). */
  protected methods(): CalculationMethod[] {
    const activity = this.activity();
    return activity ? methodsFor(this.facade.factors(), activity) : [];
  }

  protected noMethods(): boolean {
    return this.activity() !== null && this.methods().length === 0;
  }

  /** O fator que a revisão mostra (RF-05). */
  protected factor(): EmissionFactor | undefined {
    const activity = this.activity();
    const method = this.form.controls.calculationMethod.value;
    if (!activity || !method) return undefined;
    return this.facade.factors().find(
      (factor) =>
        factor.calculationMethod === method &&
        ('energySource' in activity
          ? factor.energySource === activity.energySource
          : factor.transportMode === activity.transportMode && factor.fuelType === activity.fuelType),
    );
  }

  next(): void {
    const controls = this.stepControls[this.stepName] ?? [];
    if (controls.some((control) => control.invalid)) {
      controls.forEach((control) => control.markAllAsTouched());
      return;
    }
    this.goTo(this.step() + 1);
  }

  back(): void {
    if (this.step() === 0) this.requestDismiss();
    else if (!this.facade.saving()) this.goTo(this.step() - 1);
  }

  submit(): void {
    if (this.step() < this.steps.length - 1) return this.next();
    // Só se chega à revisão por next(), que já validou cada passo.
    if (this.facade.loadingChoices() || this.facade.saving()) return;
    const value = this.form.getRawValue();
    const request$ = this.facade.submit({
      batchId: this.batchId(),
      stage: {
        stageType: value.stageType as StageType,
        destination: this.isRetail || this.isPending ? null : this.destinationValue(),
      },
      transport: this.isTransport && !this.pendingStage()?.transport ? this.transport() : null,
      emission: this.emission(value.calculationMethod as CalculationMethod),
    });
    request$?.subscribe({
      next: () => this.changed.emit(),
      complete: () => this.created.emit(),
      error: () => undefined,
    });
  }

  requestDismiss(): void {
    if (!this.facade.saving()) this.dismiss.emit();
  }

  // RNF-02: ao trocar de passo, o foco vai para o título do novo passo (mesmo padrão do cadastro).
  private goTo(step: number): void {
    this.step.set(step);
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  private activity(): { transportMode: TransportMode; fuelType: FuelType } | { energySource: EnergySource } | null {
    if (this.isTransport) {
      const { transportMode, fuelType } = this.transportGroup.getRawValue();
      return transportMode && fuelType ? { transportMode: transportMode as TransportMode, fuelType: fuelType as FuelType } : null;
    }
    const energySource = this.consumptionGroup.controls.energySource.value;
    return energySource ? { energySource: energySource as EnergySource } : null;
  }

  private dropUnavailableChoices(): void {
    const fuel = this.transportGroup.controls.fuelType;
    if (fuel.enabled && fuel.value && !this.fuels().includes(fuel.value as FuelType)) fuel.setValue('', { emitEvent: false });
    const method = this.form.controls.calculationMethod;
    if (method.value && !this.methods().includes(method.value as CalculationMethod)) method.setValue('', { emitEvent: false });
  }

  // Peso derivado vai como null: a API calcula pela quantidade (RN-07 da API).
  private emission(calculationMethod: CalculationMethod): NewEmission {
    if (this.isTransport) {
      const cargo = this.transportGroup.controls.cargoWeightKg;
      return { calculationMethod, cargoWeightKg: this.cargoDerived ? null : Number(cargo.value) };
    }
    const { energySource, consumption } = this.consumptionGroup.getRawValue();
    return { calculationMethod, energySource: energySource as EnergySource, consumption: Number(consumption) };
  }

  private destinationValue(): NewStageAddress {
    const { street, number, neighborhood, complement, zipCode, city, state } = this.form.controls.destination.getRawValue();
    return {
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      complement: complement.trim() || null,
      zipCode: digitsOnly(zipCode),
      city: city.trim(),
      state: state.trim().toUpperCase(),
    };
  }

  private transport(): NewTransport {
    const value = this.form.controls.transport.getRawValue();
    return {
      transportMode: value.transportMode as TransportMode,
      distance: Number(value.distance),
      fuelType: value.fuelType as FuelType,
      capacity: Number(value.capacity),
    };
  }
}
