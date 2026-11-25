import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { StepperComponent } from '../../../../../shared/ui/stepper/index.component';
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
  imports: [ReactiveFormsModule, ModalComponent, StepperComponent],
  providers: [AddStageFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchStageModalComponent implements OnInit {
  protected readonly facade = inject(AddStageFacade);
  protected readonly orderLabel = STAGE_TYPES.map((type) => STAGE_TYPE_LABELS[type]).join(' → ');
  protected readonly steps = ['Etapa e período', 'Origem e destino', 'Emissão', 'Revisão'];
  readonly step = signal(0);
  protected stageLabel = '';
  protected readonly transportModes = TRANSPORT_MODES;
  protected readonly transportModeLabels: Readonly<Record<string, string>> = TRANSPORT_MODE_LABELS;
  protected readonly fuelTypes = FUEL_TYPES;
  protected readonly fuelTypeLabels: Readonly<Record<string, string>> = FUEL_TYPE_LABELS;
  protected readonly calculationMethods = CALCULATION_METHODS;
  protected readonly calculationMethodLabels: Readonly<Record<string, string>> = CALCULATION_METHOD_LABELS;
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
    period: this.fb.nonNullable.group({
      startedAt: ['', Validators.required],
      endedAt: [''],
    }),
    destination: this.fb.nonNullable.group({
      zipCode: ['', Validators.required],
      state: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      complement: [''],
      city: ['', Validators.required],
    }),
    // Desabilitado fora do transporte: grupo desabilitado não entra na validação.
    transport: this.fb.group({
      transportMode: ['', Validators.required],
      distance: [null as number | null, [Validators.required, POSITIVE]],
      fuelType: ['', Validators.required],
      capacity: [null as number | null, [Validators.required, POSITIVE]],
    }),
    calculationMethod: ['GHG_PROTOCOL', Validators.required],
    calculateEmission: [false],
  });

  protected readonly originLabel = computed(() => placeLabel(this.origin() ?? this.facade.ownAddress()));
  protected readonly marketLabel = computed(() => placeLabel(this.facade.ownAddress()));
  protected readonly zipCodeLookup = lookUpCompanyZipCode(this.form.controls.destination);
  protected isRetail = false;
  /** Grupo validado ao avançar de cada passo; a revisão não tem campos. */
  private readonly stepGroups = [this.form.controls.period, this.form.controls.destination, this.form.controls.transport];

  constructor() {
    formatZipCodeWhileTyping(this.form.controls.destination.controls.zipCode);
  }

  // A API só aceita a próxima etapa da sequência.
  ngOnInit(): void {
    const stage = nextStage(this.currentStage());
    this.stageLabel = stage ? STAGE_TYPE_LABELS[stage] : '';
    this.form.controls.stageType.setValue(stage ?? '');
    // O varejo termina no endereço do mercado (RN-03 da API): o grupo desabilitado sai da validação.
    this.isRetail = stage === 'RETAIL';
    if (this.isRetail) this.form.controls.destination.disable();
    if (stage !== 'TRANSPORT') this.form.controls.transport.disable();
  }

  protected get destination() {
    return this.form.controls.destination;
  }

  protected get period() {
    return this.form.controls.period;
  }

  protected get transportGroup() {
    return this.form.controls.transport;
  }

  get isTransport(): boolean {
    return this.form.controls.stageType.value === 'TRANSPORT';
  }

  next(): void {
    const group = this.stepGroups[this.step()];
    if (!group) return;
    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }
    this.step.update((step) => step + 1);
  }

  back(): void {
    if (this.step() === 0) this.requestDismiss();
    else if (!this.facade.saving()) this.step.update((step) => step - 1);
  }

  submit(): void {
    // Só se chega à revisão por next(), que já validou cada passo.
    if (this.step() !== this.steps.length - 1 || this.facade.loadingChoices() || this.facade.saving()) return;
    const value = this.form.getRawValue();
    const request$ = this.facade.submit({
      batchId: this.batchId(),
      stage: {
        stageType: value.stageType as StageType,
        startedAt: value.period.startedAt,
        endedAt: value.period.endedAt || null,
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
    const value = this.form.controls.transport.getRawValue();
    return {
      transportMode: value.transportMode as TransportMode,
      distance: Number(value.distance),
      fuelType: value.fuelType as FuelType,
      capacity: Number(value.capacity),
    };
  }

}
