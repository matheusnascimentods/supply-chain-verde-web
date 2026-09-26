import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportsService } from '../index.service';
@Component({ selector:'app-reports-form', imports:[ReactiveFormsModule, RouterLink], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class ReportFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(ReportsService); private readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly editing=signal(!!this.route.snapshot.paramMap.get('id')); readonly saving=signal(false); readonly error=signal('');
  readonly form=this.fb.group({ supplierId: ['', [Validators.required]], startDate: ['', [Validators.required]], endDate: ['', [Validators.required]] });
  private data(): any { const value = this.form.getRawValue(); return value; }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); this.service.generate(Number(this.form.value.supplierId), { startDate: this.form.value.startDate!, endDate: this.form.value.endDate! }).subscribe({next:()=>{this.saving.set(false);this.router.navigate(['../'],{relativeTo:this.route});},error:()=>{this.saving.set(false);this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');}}); }
}
