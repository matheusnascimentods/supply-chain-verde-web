import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CertificationsService } from '../index.service';
@Component({ selector:'app-certifications-form', imports:[ReactiveFormsModule, RouterLink], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class CertificationFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(CertificationsService); private readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly editing=signal(!!this.route.snapshot.paramMap.get('id')); readonly saving=signal(false); readonly error=signal('');
  readonly form=this.fb.group({ name: ['', [Validators.required]], issuingOrganization: ['', [Validators.required]], certificationNumber: ['', [Validators.required]], issuedAt: ['', [Validators.required]], expiresAt: ['', [Validators.required]], documentUrl: ['', []] });
  private data(): any { const value = this.form.getRawValue(); return value; }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); this.service.create(Number(sessionStorage.getItem('supplierId')), this.data()).subscribe({next:()=>{this.saving.set(false);this.router.navigate(['../'],{relativeTo:this.route});},error:()=>{this.saving.set(false);this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');}}); }
}
