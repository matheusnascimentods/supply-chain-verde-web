import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { reportPdfFileName, reportPdfMarkdown } from '../../../infrastructure/report-pdf/index.mapper';
import { ReportPdfExporter } from '../../../infrastructure/report-pdf/index.exporter';
import { ReportsRepository } from '../../../infrastructure/report/index.repository';

@Injectable({ providedIn: 'root' })
export class DownloadReportPdfUseCase {
  private readonly repository = inject(ReportsRepository);
  private readonly exporter = inject(ReportPdfExporter);

  execute(reportId: number): Observable<void> {
    return this.repository
      .loadDetail(reportId)
      .pipe(switchMap((report) => this.exporter.export(reportPdfMarkdown(report), reportPdfFileName(report))));
  }
}
