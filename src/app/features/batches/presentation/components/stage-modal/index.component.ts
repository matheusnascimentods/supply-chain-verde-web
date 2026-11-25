import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output } from '@angular/core';
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
  protected stageLabel = '';
  protected readonly transportModes = TRANSPORT_MODES;
  protected readonly transportModeLabels = TRANSPORT_MODE_LABELS;
  protected readonly fuelTypes = FUEL_TYPES;
  protected readonly fuelTypeLabels = FUEL_TYPE_LABELS;
  protected readonly calculationMethods = CALCULATION_METHODS;
  protected readonly calculationMethodLabels = CALCULATION_METHOD_LABELS;

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

  submit(): void {
    if (this.facade.loadingChoices() || this.facade.saving()) return;
    // Depois que a etapa foi salva, uma nova tentativa só completa transporte e emissão.
    if (!this.facade.stageSaved() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
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
