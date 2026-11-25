import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { formatZipCodeWhileTyping, lookUpCompanyZipCode } from '../../../../../shared/forms/company-fields/index.helper';
import { digitsOnly } from '../../../../../shared/utils/format/index.utils';
import { AddStageFacade } from '../../../application/add-stage/index.facade';
import {
  CALCULATION_METHODS,
  CALCULATION_METHOD_LABELS,
  CalculationMethod,
  FUEL_TYPES,
  FUEL_TYPE_LABELS,
  FuelType,
  NewStageAddress,
  NewTransport,
  STAGE_TYPES,
  STAGE_TYPE_LABELS,
  StageAddress,
  StageType,
  TRANSPORT_MODES,
  TRANSPORT_MODE_LABELS,
  TransportMode,
  nextStage,
  placeLabel,
} from '../../../domain/stage/index.model';

const POSITIVE = Validators.min(0.000001);

type WizardStep = 0 | 1 | 2 | 3;

const NEXT_STEP: Record<WizardStep, WizardStep> = { 0: 1, 1: 2, 2: 3, 3: 3 };
const PREVIOUS_STEP: Record<WizardStep, WizardStep> = { 0: 0, 1: 0, 2: 1, 3: 2 };

@Component({
  selector: 'app-batch-stage-modal',
  imports: [ReactiveFormsModule, ModalComponent],
  providers: [AddStageFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchStageModalComponent implements OnInit {
  protected readonly facade = inject(AddStageFacade);
  protected readonly orderLabel = STAGE_TYPES.map((type) => STAGE_TYPE_LABELS[type]).join(' → ');
  protected readonly steps = ['Etapa e período', 'Origem e destino', 'Emissão', 'Revisão'];
  readonly step = signal<WizardStep>(0);
  protected stageLabel = '';
  protected readonly transportModes = TRANSPORT_MODES;
  protected readonly transportModeLabels = TRANSPORT_MODE_LABELS;
  protected readonly fuelTypes = FUEL_TYPES;
  protected readonly fuelTypeLabels = FUEL_TYPE_LABELS;
  protected readonly calculationMethods = CALCULATION_METHODS;
  protected readonly calculationMethodLabels = CALCULATION_METHOD_LABELS;
  protected readonly placeLabel = placeLabel;

  readonly batchId = input.required<number>();
  readonly currentStage = input<StageType | null>(null);
  /** Destino da última etapa do lote; null antes da Produção, quando a origem é a própria companhia (RN-04 da API). */
  readonly origin = input<StageAddress | null>(null);
  readonly dismiss = output<void>();
  readonly created = output<void>();
  readonly changed = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    stageType: ['', Validators.required],
    startedAt: ['', Validators.required],
    endedAt: [''],
    destination: this.fb.nonNullable.group({
      zipCode: ['', Validators.required],
      state: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      complement: [''],
      city: ['', Validators.required],
    }),
    transportMode: [''],
    distance: [null as number | null],
    fuelType: [''],
    capacity: [null as number | null],
    calculationMethod: ['GHG_PROTOCOL', Validators.required],
    calculateEmission: [false],
  });

  protected readonly originLabel = computed(() => placeLabel(this.origin() ?? this.facade.ownAddress()));
  protected readonly marketLabel = computed(() => placeLabel(this.facade.ownAddress()));
  protected readonly zipCodeLookup = lookUpCompanyZipCode(this.form.controls.destination);
  protected isRetail = false;

  constructor() {
    formatZipCodeWhileTyping(this.form.controls.destination.controls.zipCode);
    this.form.controls.stageType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((stageType) => this.requireTransport(stageType === 'TRANSPORT'));
  }

  // A API só aceita a próxima etapa da sequência; o valueChanges acima já exige o transporte quando for o caso.
  ngOnInit(): void {
    const stage = nextStage(this.currentStage());
    this.stageLabel = stage ? STAGE_TYPE_LABELS[stage] : '';
    this.form.controls.stageType.setValue(stage ?? '');
    // O varejo termina no endereço do mercado (RN-03 da API): o grupo desabilitado sai da validação.
    this.isRetail = stage === 'RETAIL';
    if (this.isRetail) this.form.controls.destination.disable();
  }

  protected get destination() {
    return this.form.controls.destination;
  }

  get isTransport(): boolean {
    return this.form.controls.stageType.value === 'TRANSPORT';
  }

  protected selectedTransportModeLabel(): string {
    const value = this.form.controls.transportMode.value;
    const mode = TRANSPORT_MODES.find((option) => option === value);
    return mode ? TRANSPORT_MODE_LABELS[mode] : 'Não informado';
  }

  protected selectedFuelTypeLabel(): string {
    const value = this.form.controls.fuelType.value;
    const fuel = FUEL_TYPES.find((option) => option === value);
    return fuel ? FUEL_TYPE_LABELS[fuel] : 'Não informado';
  }

  protected selectedCalculationMethodLabel(): string {
    const value = this.form.controls.calculationMethod.value;
    const method = CALCULATION_METHODS.find((option) => option === value);
    return method ? CALCULATION_METHOD_LABELS[method] : 'Não informado';
  }

  next(): void {
    const currentStep = this.step();
    if (currentStep === 3 || !this.isStepValid(currentStep, true)) return;
    this.step.set(NEXT_STEP[currentStep]);
  }

  back(): void {
    if (this.facade.saving()) return;
    if (this.step() === 0) this.requestDismiss();
    else this.step.update((step) => PREVIOUS_STEP[step]);
  }

  submit(): void {
    if (this.step() !== 3 || this.facade.loadingChoices() || this.facade.saving()) return;
    for (const step of [0, 1, 2] as const) {
      if (!this.isStepValid(step, true)) {
        this.step.set(step);
        return;
      }
    }
    const value = this.form.getRawValue();
    const request$ = this.facade.submit({
      batchId: this.batchId(),
      stage: {
        stageType: value.stageType as StageType,
        startedAt: value.startedAt!,
        endedAt: value.endedAt || null,
        destination: this.isRetail ? null : this.destinationValue(),
      },
      transport: this.isTransport ? this.transport() : null,
      emissionMethod: this.facade.canCalculateEmission && value.calculateEmission ? (value.calculationMethod as CalculationMethod) : null,
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

  private isStepValid(step: Exclude<WizardStep, 3>, markTouched = false): boolean {
    if (step === 0) {
      const { startedAt } = this.form.controls;
      if (markTouched && startedAt.invalid) startedAt.markAsTouched();
      return startedAt.valid;
    }

    if (step === 1) {
      if (this.isRetail) return true;
      if (markTouched && this.destination.invalid) this.destination.markAllAsTouched();
      return this.destination.valid;
    }

    const { transportMode, distance, fuelType, capacity, calculateEmission, calculationMethod } = this.form.controls;
    const transportValid = !this.isTransport || [transportMode, distance, fuelType, capacity].every((control) => control.valid);
    const emissionValid = !this.facade.canCalculateEmission || !calculateEmission.value || calculationMethod.valid;
    if (markTouched && !transportValid) {
      for (const control of [transportMode, distance, fuelType, capacity]) control.markAsTouched();
    }
    if (markTouched && !emissionValid) calculationMethod.markAsTouched();
    return transportValid && emissionValid;
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
    const value = this.form.getRawValue();
    return {
      transportMode: value.transportMode as TransportMode,
      distance: Number(value.distance),
      fuelType: value.fuelType as FuelType,
      capacity: Number(value.capacity),
    };
  }

  private requireTransport(required: boolean): void {
    const { transportMode, distance, fuelType, capacity } = this.form.controls;
    transportMode.setValidators(required ? [Validators.required] : []);
    fuelType.setValidators(required ? [Validators.required] : []);
    distance.setValidators(required ? [Validators.required, POSITIVE] : []);
    capacity.setValidators(required ? [Validators.required, POSITIVE] : []);
    for (const control of [transportMode, distance, fuelType, capacity]) control.updateValueAndValidity({ emitEvent: false });
  }
}
