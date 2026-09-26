import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BatchesService } from '../index.service';
@Component({ selector:'app-batches-form', imports:[ReactiveFormsModule, RouterLink], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class BatchFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(BatchesService); private readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly editing=signal(!!this.route.snapshot.paramMap.get('id')); readonly saving=signal(false); readonly error=signal('');
  readonly form=this.fb.group({ productId: ['', [Validators.required]], quantity: ['', [Validators.required]], producedAt: ['', [Validators.required]], expirationDate: ['', []] });
  private data(): any { const value = this.form.getRawValue(); return value; }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); this.service.create(this.data()).subscribe({next:()=>{this.saving.set(false);this.router.navigate(['../'],{relativeTo:this.route});},error:()=>{this.saving.set(false);this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');}}); }
}
