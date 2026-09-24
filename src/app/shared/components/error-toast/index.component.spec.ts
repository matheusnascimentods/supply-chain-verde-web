import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorToastComponent } from './index.component';
import { ErrorToastService } from './index.service';

describe('ErrorToastComponent', () => {
  let fixture: ComponentFixture<ErrorToastComponent>;
  let component: ErrorToastComponent;
  let service: ErrorToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorToastComponent],
      providers: [ErrorToastService],
    }).compileComponents();

    service = TestBed.inject(ErrorToastService);
    fixture = TestBed.createComponent(ErrorToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render nothing when there are no toasts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('[data-testid="toast-container"]');
    expect(container).toBeNull();
  });

  it('should render toasts emitted by ErrorToastService', () => {
    service.show('Erro 1: falha de conexão');
    service.show('Erro 2: token inválido');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-testid="toast-item"]');

    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Erro 1: falha de conexão');
    expect(items[1].textContent).toContain('Erro 2: token inválido');
  });

  it('should call dismiss when close button is clicked', () => {
    const id = service.show('Erro teste');
    fixture.detectChanges();

    expect(service.toasts().length).toBe(1);

    const closeBtn = fixture.nativeElement.querySelector(
      '[data-testid="toast-dismiss-button"]'
    ) as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(service.toasts().length).toBe(0);
    const container = fixture.nativeElement.querySelector('[data-testid="toast-container"]');
    expect(container).toBeNull();
  });

  it('should have accessibility attributes role="alert" and aria-live="assertive"', () => {
    service.show('Erro de validação');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const item = compiled.querySelector('[role="alert"]');

    expect(item).toBeTruthy();
    expect(item?.getAttribute('aria-live')).toBe('assertive');
  });
});
