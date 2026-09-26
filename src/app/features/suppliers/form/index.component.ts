import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SuppliersService } from '../index.service';
@Component({ selector:'app-suppliers-form', imports:[ReactiveFormsModule, RouterLink], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class SupplierFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(SuppliersService); private readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly editing=signal(!!this.route.snapshot.paramMap.get('id')); readonly saving=signal(false); readonly error=signal('');
  readonly form=this.fb.group({ name: ['', [Validators.required]], cnpj: ['', [Validators.required]], phone: ['', [Validators.required]], street: ['', [Validators.required]], number: ['', [Validators.required]], neighborhood: ['', [Validators.required]], complement: ['', []], zipCode: ['', [Validators.required]], city: ['', [Validators.required]], state: ['', [Validators.required]] });
  constructor() { const id = this.route.snapshot.paramMap.get('id'); if (id) this.service.get(Number(id)).subscribe({ next: (supplier) => this.form.patchValue({ name: supplier.name, cnpj: supplier.cnpj, phone: supplier.phone, street: supplier.address.street, number: supplier.address.number, neighborhood: supplier.address.neighborhood, complement: supplier.address.complement, zipCode: supplier.address.zipCode, city: supplier.address.city, state: supplier.address.state }), error: () => this.error.set('Não foi possível carregar o fornecedor.') }); }
  private data(): any { const v = this.form.getRawValue(); return { name:v.name, cnpj:v.cnpj, phone:v.phone, address:{ street:v.street, number:v.number, neighborhood:v.neighborhood, complement:v.complement, zipCode:v.zipCode, city:v.city, state:v.state } }; }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); (this.editing() ? this.service.update(Number(this.route.snapshot.paramMap.get('id')), this.data()) : this.service.create(this.data())).subscribe({next:()=>{this.saving.set(false);this.router.navigate(['../'],{relativeTo:this.route});},error:()=>{this.saving.set(false);this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');}}); }
}
