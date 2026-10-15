import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { reportPdfFileName, reportPdfVariables } from '../../../infrastructure/report-pdf/index.mapper';
import { ReportPdfExporter } from '../../../infrastructure/report-pdf/index.exporter';
import { render } from '../../../infrastructure/report-pdf/index.render';
import template from '../../../infrastructure/report-pdf/index.template.md';
import { ReportsRepository } from '../../../infrastructure/report/index.repository';

@Injectable({ providedIn: 'root' })
export class DownloadReportPdfUseCase {
  private readonly repository = inject(ReportsRepository);
  private readonly exporter = inject(ReportPdfExporter);

  execute(reportId: number): Observable<void> {
    return this.repository
      .loadDetail(reportId)
      .pipe(switchMap((report) => this.exporter.export(render(template, reportPdfVariables(report)), reportPdfFileName(report))));
  }
}
