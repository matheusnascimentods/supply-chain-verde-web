import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './index.interceptor';
import { SessionService } from '../session/index.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        SessionService,
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.clear();
  });

  it('should add Authorization Bearer header when token is present', () => {
    sessionService.setSession('test-token-123', 'admin');

    httpClient.get('/api/test').subscribe();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    req.flush({});
  });

  it('should not add Authorization header when token is absent', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should pass through successful response', () => {
    const mockData = { id: 1, name: 'Item' };

    httpClient.get('/api/test').subscribe((res) => {
      expect(res).toEqual(mockData);
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(mockData);
  });

  it('should clear session, navigate to /login and throw error on 401 Unauthorized', () => {
    sessionService.setSession('test-token-123', 'manager');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const clearSessionSpy = vi.spyOn(sessionService, 'clearSession');

    let errorReceived: unknown;
    httpClient.get('/api/test').subscribe({
      next: () => expect.fail('should have failed with 401'),
      error: (err) => {
        errorReceived = err;
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(clearSessionSpy).toHaveBeenCalled();
    expect(sessionService.token).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(errorReceived).toBeDefined();
  });

  it('should clear session, navigate to /login and throw error on 403 Forbidden', () => {
    sessionService.setSession('test-token-123', 'supplier');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const clearSessionSpy = vi.spyOn(sessionService, 'clearSession');

    let errorReceived: unknown;
    httpClient.get('/api/test').subscribe({
      next: () => expect.fail('should have failed with 403'),
      error: (err) => {
        errorReceived = err;
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(clearSessionSpy).toHaveBeenCalled();
    expect(sessionService.token).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(errorReceived).toBeDefined();
  });

  it('should not clear session or navigate on 500 Internal Server Error', () => {
    sessionService.setSession('test-token-123', 'auditor');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const clearSessionSpy = vi.spyOn(sessionService, 'clearSession');

    let errorReceived: unknown;
    httpClient.get('/api/test').subscribe({
      next: () => expect.fail('should have failed with 500'),
      error: (err) => {
        errorReceived = err;
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(clearSessionSpy).not.toHaveBeenCalled();
    expect(sessionService.token).toBe('test-token-123');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(errorReceived).toBeDefined();
  });

  it('should not clear session or navigate on 400 Bad Request', () => {
    sessionService.setSession('test-token-123', 'admin');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const clearSessionSpy = vi.spyOn(sessionService, 'clearSession');

    httpClient.get('/api/test').subscribe({
      next: () => expect.fail('should have failed with 400'),
      error: () => {},
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    expect(clearSessionSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
