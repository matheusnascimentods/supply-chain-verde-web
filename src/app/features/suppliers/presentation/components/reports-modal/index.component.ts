import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { formatIsoDateBr, formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { SupplierReportsFacade } from '../../../application/report/index.facade';

@Component({
  selector: 'app-supplier-reports-modal',
  imports: [ReactiveFormsModule, ModalComponent, PaginationComponent],
  providers: [SupplierReportsFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierReportsModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly facade = inject(SupplierReportsFacade);
  protected readonly date = formatIsoDateBr;

  readonly supplierId = input.required<number>();
  readonly supplierName = input.required<string>();
  readonly canGenerate = input(false);
  readonly dismissed = output<void>();
  readonly generated = output<void>();

  readonly form = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.facade.open(this.supplierId());
  }

  close(): void {
    if (!this.facade.saving()) this.dismissed.emit();
  }

  invalidPeriod(): boolean {
    const { startDate, endDate } = this.form.getRawValue();
    return !!startDate && !!endDate && startDate > endDate;
  }

  submit(): void {
    if (this.form.invalid || this.invalidPeriod() || !this.canGenerate()) {
      this.form.markAllAsTouched();
      return;
    }
    const { startDate, endDate } = this.form.getRawValue();
    this.facade.generate({ periodStartAt: startDate, periodEndAt: endDate }).subscribe({
      next: () => {
        this.form.reset();
        this.generated.emit();
      },
      error: () => undefined,
    });
  }

  protected co2(value: number): string {
    return `${formatNumberBr(value)} kg`;
  }
}
