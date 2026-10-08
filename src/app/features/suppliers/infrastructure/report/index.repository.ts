import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Page } from '../../domain/index.model';
import { Report, ReportPeriod } from '../../domain/report/index.model';
import { GeneratedReportDTO, generatedReportSchema, reportPageSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class ReportsRepository {
  private readonly http = inject(HttpClient);

  loadBySupplier(supplierId: number, params: { limit: number; offset: number }): Observable<Page<Report>> {
    const query = { supplierId: String(supplierId), limit: String(params.limit), offset: String(params.offset) };
    return this.http.get<unknown>(`${environment.apiUrl}/reports`, { params: query }).pipe(
      map((raw) => {
        const page = reportPageSchema.parse(raw);
        return { items: page.items, totalPages: page.totalPages };
      }),
    );
  }

  generate(supplierId: number, period: ReportPeriod): Observable<GeneratedReportDTO> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/reports`, period)
      .pipe(map((raw) => generatedReportSchema.parse(raw)));
  }
}
