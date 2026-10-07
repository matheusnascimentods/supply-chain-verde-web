import { TestBed } from '@angular/core/testing';
import { ErrorToastService } from './index.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ErrorToastService', () => {
  let service: ErrorToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created and have empty toasts initially', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast via show and return its id', () => {
    const id = service.show('Ocorreu uma falha na requisição.');
    const toasts = service.toasts();

    expect(id).toBeTruthy();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Ocorreu uma falha na requisição.');
    expect(toasts[0].id).toBe(id);
  });

  it('should dismiss toast by id', () => {
    const id1 = service.show('Erro 1');
    const id2 = service.show('Erro 2');

    expect(service.toasts().length).toBe(2);

    service.dismiss(id1);
    const remaining = service.toasts();

    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(id2);
  });

  it('should clear all toasts', () => {
    service.show('Erro 1');
    service.show('Erro 2');

    expect(service.toasts().length).toBe(2);

    service.clear();
    expect(service.toasts()).toEqual([]);
  });

  it('should auto-dismiss toast after specified duration', () => {
    service.show('Erro temporário', 3000);
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(2999);
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(1);
    expect(service.toasts().length).toBe(0);
  });
});
