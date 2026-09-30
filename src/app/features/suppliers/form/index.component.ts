import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { catchError, distinctUntilChanged, finalize, map, of, startWith, switchMap, tap, timer } from 'rxjs';
import { SuppliersService } from '../index.service';
import { SupplierRequestDTO, ViaCepResponseDTO } from '../index.schema';

@Component({
  selector: 'app-suppliers-form',
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SuppliersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private previousFocus: HTMLElement | null = null;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  readonly modal = input(false);
  readonly saved = output<void>();
  readonly dismissed = output<void>();
  readonly editing = signal(!!this.route.snapshot.paramMap.get('id') || this.route.snapshot.routeConfig?.path === 'suppliers/me');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly cepLoading = signal(false);
  readonly cepMessage = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    cnpj: ['', Validators.required],
    phone: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    neighborhood: ['', Validators.required],
    complement: [''],
    zipCode: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')
      ?? (this.route.snapshot.routeConfig?.path === 'suppliers/me' ? sessionStorage.getItem('supplierId') : null);

    if (id) {
      this.service.get(Number(id)).subscribe({
        next: (supplier) => this.form.patchValue({
          name: supplier.name,
          cnpj: supplier.cnpj ?? '',
          phone: supplier.phone ?? '',
          street: supplier.address?.street ?? '',
          number: supplier.address?.number ?? '',
          neighborhood: supplier.address?.neighborhood ?? '',
          complement: supplier.address?.complement ?? '',
          zipCode: supplier.address?.zipCode ?? '',
          city: supplier.address?.city ?? '',
          state: supplier.address?.state ?? '',
        }),
        error: () => this.error.set('Não foi possível carregar o fornecedor.'),
      });
    } else if (this.route.snapshot.routeConfig?.path === 'suppliers/me') {
      this.error.set('Não foi possível identificar o fornecedor desta sessão.');
    }

    if (!this.editing()) this.watchZipCode();
  }

  ngAfterViewInit(): void {
    if (!this.modal()) return;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => this.dialog?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  closeModal(): void {
    if (!this.saving()) this.dismissed.emit();
  }

  handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = this.dialog?.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      this.dialog?.nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    const supplierId = this.route.snapshot.paramMap.get('id') ?? sessionStorage.getItem('supplierId');
    const request = this.editing()
      ? this.service.update(Number(supplierId), this.data())
      : this.service.create(this.data());

    request.subscribe({
      next: () => {
        this.saving.set(false);
        if (this.modal()) {
          this.saved.emit();
          return;
        }
        this.router.navigate(['/suppliers']);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }

  private data(): SupplierRequestDTO {
    const value = this.form.getRawValue();
    return {
      name: value.name,
      cnpj: value.cnpj,
      phone: value.phone,
      address: {
        street: value.street,
        number: value.number,
        neighborhood: value.neighborhood,
        complement: value.complement,
        zipCode: value.zipCode,
        city: value.city,
        state: value.state,
      },
    };
  }

  private watchZipCode(): void {
    this.form.controls.zipCode.valueChanges.pipe(
      startWith(this.form.controls.zipCode.value),
      map((value) => value.replace(/\D/g, '')),
      distinctUntilChanged(),
      switchMap((zipCode) => {
        if (zipCode.length !== 8) {
          this.cepLoading.set(false);
          this.cepMessage.set('');
          return of(null);
        }

        this.cepLoading.set(true);
        this.cepMessage.set('');
        return timer(350).pipe(
          switchMap(() => this.service.lookupZipCode(zipCode)),
          catchError(() => {
            this.cepMessage.set('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.');
            return of(null);
          }),
          tap((response) => this.applyZipCodeResponse(response)),
          finalize(() => this.cepLoading.set(false)),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }

  private applyZipCodeResponse(response: ViaCepResponseDTO | null): void {
    if (!response) return;
    if (response.erro === true || response.erro === 'true') {
      this.cepMessage.set('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
      return;
    }

    this.form.patchValue({
      street: response.logradouro ?? '',
      neighborhood: response.bairro ?? '',
      city: response.localidade ?? '',
      state: response.uf ?? '',
    }, { emitEvent: false });
    this.cepMessage.set('Endereço localizado. Confira os dados antes de salvar.');
  }
}
