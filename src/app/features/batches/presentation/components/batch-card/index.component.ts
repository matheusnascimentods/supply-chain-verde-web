import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { Batch } from '../../../domain/index.model';
import { PRODUCT_UNIT_SYMBOLS, ProductUnit } from '../../../domain/product/index.model';
import { STAGE_TYPE_LABELS, Stage, StageAddress, TRANSPORT_MODE_LABELS } from '../../../domain/stage/index.model';

@Component({
  selector: 'app-batch-card',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-stage]': "batch().currentStage ?? 'CREATED'" },
})
export class BatchCardComponent {
  readonly batch = input.required<Batch>();
  readonly unit = input<ProductUnit | undefined>(undefined);
  readonly canAddStage = input(false);
  readonly addStage = output<void>();

  protected readonly stageLabels = STAGE_TYPE_LABELS;
  protected readonly transportModeLabels = TRANSPORT_MODE_LABELS;

  protected quantity(): string {
    const unit = this.unit();
    return `${formatNumberBr(this.batch().quantity)}${unit ? ` ${PRODUCT_UNIT_SYMBOLS[unit]}` : ''}`;
  }

  protected supplierName(): string {
    return this.batch().supplierName ?? 'Fornecedor não identificado';
  }

  protected routeOrigin(): string {
    const first = this.batch().stages[0];
    return first ? addressLabel(first.originAddress, this.supplierName()) : this.supplierName();
  }

  protected routeDestination(): string {
    const last = this.batch().stages.at(-1);
    if (!last) return 'Etapas ainda não registradas';
    return addressLabel(last.destinationAddress, STAGE_TYPE_LABELS[last.stageType]);
  }

  protected stageAddress(stage: Stage): string {
    const origin = addressLabel(stage.originAddress, 'Local não informado');
    const destination = stage.destinationAddress ? addressLabel(stage.destinationAddress, '') : '';
    return destination && destination !== origin ? `${origin} → ${destination}` : origin;
  }

  protected formatDate(value: string, includeTime = false): string {
    // Datas sem hora são lidas no fuso local para não voltarem um dia.
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
      : new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(
      'pt-BR',
      includeTime
        ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: 'short', year: 'numeric' },
    ).format(date);
  }
}

function addressLabel(address: StageAddress | null, fallback: string): string {
  if (!address) return fallback;
  return [address.city, address.state].filter(Boolean).join(', ') || fallback;
}
