import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogService } from './index.service';
import { AuditLogComponent } from './index.component';
describe('AuditLogComponent', () => { let fixture: ComponentFixture<AuditLogComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [AuditLogComponent], providers: [{ provide: AuditLogService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(AuditLogComponent); fixture.detectChanges(); }); it('should create and load audit events', () => expect(fixture.componentInstance.logs()).toEqual([])); });
