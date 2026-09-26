import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../index.service';
import { EnumSelectComponent } from '../../../shared/components/enum-select/index.component';
import { productCategorySchema, productUnitSchema } from '../index.schema';
@Component({ selector:'app-products-form', imports:[ReactiveFormsModule, RouterLink, EnumSelectComponent], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class ProductFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(ProductsService); private readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly editing=signal(!!this.route.snapshot.paramMap.get('id')); readonly saving=signal(false); readonly error=signal('');
  readonly productCategorySchema = productCategorySchema; readonly productUnitSchema = productUnitSchema;
  readonly form=this.fb.group({ name: ['', [Validators.required]], description: ['', []], category: ['', [Validators.required]], unit: ['', [Validators.required]] });
  constructor() { const id = this.route.snapshot.paramMap.get('id'); if (id) this.service.get(Number(id)).subscribe({ next: (product) => this.form.patchValue({ name: product.name, description: product.description, category: product.category, unit: product.unit }), error: () => this.error.set('Não foi possível carregar o produto.') }); }
  private data(): any { const value = this.form.getRawValue(); return value; }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); (this.editing() ? this.service.update(Number(this.route.snapshot.paramMap.get('id')), this.data()) : this.service.create(this.data())).subscribe({next:()=>{this.saving.set(false);this.router.navigate(['../'],{relativeTo:this.route});},error:()=>{this.saving.set(false);this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');}}); }
}
