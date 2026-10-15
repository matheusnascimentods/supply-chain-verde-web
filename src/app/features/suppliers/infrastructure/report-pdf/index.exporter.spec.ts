import { ReportPdfExporter } from './index.exporter';

describe('ReportPdfExporter', () => {
  const print = vi.fn();
  const originalTitle = document.title;

  beforeEach(() => {
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockImplementation(function (this: HTMLIFrameElement) {
      const view = this.contentDocument!.defaultView!;
      view.print = print;
      return view;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('iframe').forEach((frame) => frame.remove());
    document.title = originalTitle;
  });

  it('keeps the print frame and the file name until the browser finishes printing', async () => {
    await new ReportPdfExporter().export('# Relatório', 'relatorio-x');

    const frame = document.querySelector('iframe')!;
    expect(print).toHaveBeenCalled();
    expect(frame.contentDocument!.body.innerHTML).toContain('<h1>Relatório</h1>');
    expect(frame.contentDocument!.title).toBe('');
    expect(document.title).toBe('relatorio-x');

    frame.contentDocument!.defaultView!.dispatchEvent(new Event('afterprint'));
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.title).toBe(originalTitle);
  });

  it('restores the title of a previous print that never finished', async () => {
    const exporter = new ReportPdfExporter();
    await exporter.export('# A', 'relatorio-a');
    await exporter.export('# B', 'relatorio-b');

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    document.querySelector('iframe')!.contentDocument!.defaultView!.dispatchEvent(new Event('afterprint'));
    expect(document.title).toBe(originalTitle);
  });
});
