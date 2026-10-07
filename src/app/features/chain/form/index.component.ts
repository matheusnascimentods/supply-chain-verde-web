import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionService } from '../../../core/auth/session/index.service';
import { EnumSelectComponent } from '../../../shared/ui/enum-select/index.component';
import { CurrentUserService } from '../../../core/auth/session/current-user/index.service';
import {
  calculationMethodSchema,
  fuelTypeSchema,
  stageTypeSchema,
  transportModeSchema,
} from '../../traceability/index.schema';
import { ChainService } from '../index.service';

@Component({
  selector: 'app-chain-form',
  imports: [ReactiveFormsModule, RouterLink, EnumSelectComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChainFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ChainService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly session = inject(SessionService);
  readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly stageTypes = stageTypeSchema.options;
  readonly transportModes = transportModeSchema.options;
  readonly fuelTypes = fuelTypeSchema.options;
  readonly calculationMethods = calculationMethodSchema.options;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly stageId = signal<number | null>(null);
  readonly canCalculateEmission = ['admin', 'manager'].includes(this.session.role() ?? '');
  readonly form = this.fb.group({
    stageType: ['', Validators.required],
    startedAt: ['', Validators.required],
    endedAt: [''],
    originAddressId: [''],
    destinationAddressId: [''],
    transportMode: [''],
    distance: [0],
    fuelType: [''],
    capacity: [0],
    calculationMethod: ['DEFRA', Validators.required],
  });

  get isTransport(): boolean {
    return this.form.controls.stageType.value === 'TRANSPORT';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const batchId = Number(this.route.snapshot.paramMap.get('batchId'));

    this.currentUserService.load().subscribe({
      error: () => this.fail(),
      next: (user) =>
        this.service
          .createStage(batchId, user.userId, {
            batchId,
            originAddressId: value.originAddressId ? Number(value.originAddressId) : null,
            destinationAddressId: value.destinationAddressId
              ? Number(value.destinationAddressId)
              : null,
            stageType: value.stageType as (typeof stageTypeSchema.options)[number],
            startedAt: this.toApiDateTime(value.startedAt!),
            endedAt: value.endedAt ? this.toApiDateTime(value.endedAt) : null,
          })
          .subscribe({
            error: () => this.fail(),
            next: (stage) => {
              this.stageId.set(stage.chainId);
              const calculateEmission = () => {
                if (!this.canCalculateEmission) {
                  this.finish(batchId);
                  return;
                }
                this.service
                  .calculateEmission(stage.chainId, {
                    chainId: stage.chainId,
                    calculationMethod:
                      value.calculationMethod as (typeof calculationMethodSchema.options)[number],
                  })
                  .subscribe({ next: () => this.finish(batchId), error: () => this.fail() });
              };
              if (this.isTransport) {
                this.service
                  .createTransport(stage.chainId, {
                    chainId: stage.chainId,
                    transportMode:
                      value.transportMode as (typeof transportModeSchema.options)[number],
                    distance: Number(value.distance),
                    fuelType: value.fuelType as (typeof fuelTypeSchema.options)[number],
                    capacity: Number(value.capacity),
                  })
                  .subscribe({ next: calculateEmission, error: () => this.fail() });
              } else calculateEmission();
            },
          }),
    });
  }

  private toApiDateTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }
  private finish(batchId: number): void {
    this.saving.set(false);
    this.router.navigate(['/batches', batchId, 'stages']);
  }
  private fail(): void {
    this.saving.set(false);
    this.error.set(
      'Não foi possível registrar a etapa, transporte ou emissão. Confira os dados e tente novamente.',
    );
  }
}
