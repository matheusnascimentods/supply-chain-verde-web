import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuditLogService } from './index.service';

describe('AuditLogService', () => {
  let service: AuditLogService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(AuditLogService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('should be created', () => expect(service).toBeTruthy());
});
