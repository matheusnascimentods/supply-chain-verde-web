import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { AddStageFacade } from '../../../application/add-stage/index.facade';
import {
  CALCULATION_METHODS,
  CALCULATION_METHOD_LABELS,
  CalculationMethod,
  FUEL_TYPES,
  FUEL_TYPE_LABELS,
  FuelType,
  NewTransport,
  STAGE_TYPES,
  STAGE_TYPE_LABELS,
  StageType,
  TRANSPORT_MODES,
  TRANSPORT_MODE_LABELS,
  TransportMode,
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
export class BatchStageModalComponent {
  protected readonly facade = inject(AddStageFacade);
  protected readonly stageTypes = STAGE_TYPES;
  protected readonly stageTypeLabels = STAGE_TYPE_LABELS;
  protected readonly transportModes = TRANSPORT_MODES;
  protected readonly transportModeLabels = TRANSPORT_MODE_LABELS;
  protected readonly fuelTypes = FUEL_TYPES;
  protected readonly fuelTypeLabels = FUEL_TYPE_LABELS;
  protected readonly calculationMethods = CALCULATION_METHODS;
  protected readonly calculationMethodLabels = CALCULATION_METHOD_LABELS;

  readonly batchId = input.required<number>();
  readonly dismiss = output<void>();
  readonly created = output<void>();
  readonly changed = output<void>();

  readonly form = inject(FormBuilder).group({
    stageType: ['', Validators.required],
    startedAt: ['', Validators.required],
    endedAt: [''],
    originAddressId: [''],
    destinationAddressId: [''],
    transportMode: [''],
    distance: [null as number | null],
    fuelType: [''],
    capacity: [null as number | null],
    calculationMethod: ['GHG_PROTOCOL', Validators.required],
    calculateEmission: [false],
  });

  constructor() {
    this.form.controls.stageType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((stageType) => this.requireTransport(stageType === 'TRANSPORT'));
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
        originAddressId: value.originAddressId ? Number(value.originAddressId) : null,
        destinationAddressId: value.destinationAddressId ? Number(value.destinationAddressId) : null,
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
