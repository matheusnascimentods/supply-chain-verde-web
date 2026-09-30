import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuditLogService } from './index.service';
import { AuditLogComponent } from './index.component';

describe('AuditLogComponent', () => {
  let fixture: ComponentFixture<AuditLogComponent>;
  const service = {
    load: vi.fn().mockReturnValue(of({ content: [], hasNext: false })),
    loadAll: vi.fn().mockReturnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AuditLogComponent], providers: [{ provide: AuditLogService, useValue: service }] }).compileComponents();
    fixture = TestBed.createComponent(AuditLogComponent);
    fixture.detectChanges();
  });

  it('should create and load audit events', () => expect(fixture.componentInstance.logs()).toEqual([]));

  it('should submit the export form from inside the modal', () => {
    fixture.componentInstance.openExport();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[role="dialog"] button[type="submit"]') as HTMLButtonElement).click();
    expect(service.loadAll).toHaveBeenCalled();
  });
});
