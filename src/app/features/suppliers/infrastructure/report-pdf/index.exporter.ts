import { Injectable } from '@angular/core';

const PRINT_STYLE = `
  @page { size: A4; margin: 18mm; }
  body { font: 11pt/1.5 system-ui, sans-serif; color: #0f172a; }
  h1 { color: #15803d; margin: 0 0 4pt; }
  h2 { border-bottom: 1px solid #cbd5e1; padding-bottom: 2pt; margin-top: 18pt; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0; }
  th, td { border: 1px solid #cbd5e1; padding: 4pt 6pt; text-align: left; }
  th { background: #f1f5f9; }
  tr { break-inside: avoid; }
`;

/** Converte o Markdown em HTML e abre a impressão do navegador, onde o usuário salva como PDF. */
@Injectable({ providedIn: 'root' })
export class ReportPdfExporter {
  async export(markdown: string, fileName: string): Promise<void> {
    const { marked } = await import('marked');
    const body = await marked.parse(markdown);
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.append(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${fileName}</title><style>${PRINT_STYLE}</style></head><body>${body}</body></html>`);
    doc.close();
    // O navegador sugere o título da página como nome do arquivo.
    const previousTitle = document.title;
    document.title = fileName;
    // O Chrome adia o print() enquanto o documento ainda carrega: o iframe só pode sair depois da impressão.
    const view = frame.contentWindow!;
    view.addEventListener(
      'afterprint',
      () => {
        document.title = previousTitle;
        frame.remove();
      },
      { once: true },
    );
    view.print();
  }
}
