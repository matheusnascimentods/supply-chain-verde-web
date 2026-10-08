import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportPeriod } from '../../../domain/report/index.model';
import { GeneratedReportDTO } from '../../../infrastructure/report/index.dto';
import { ReportsRepository } from '../../../infrastructure/report/index.repository';

@Injectable({ providedIn: 'root' })
export class GenerateReportUseCase {
  private readonly repository = inject(ReportsRepository);

  execute(supplierId: number, period: ReportPeriod): Observable<GeneratedReportDTO> {
    return this.repository.generate(supplierId, period);
  }
}
