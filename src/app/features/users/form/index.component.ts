import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '../index.service';
import { EnumSelectComponent } from '../../../shared/components/enum-select/index.component';
import { userRoleSchema } from '../index.schema';
@Component({ selector:'app-users-form', imports:[ReactiveFormsModule, RouterLink, EnumSelectComponent], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class UserFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(UsersService); private readonly route=inject(ActivatedRoute); private readonly router=inject(Router);
  readonly editing=signal(!!this.route.snapshot.paramMap.get('id')); readonly saving=signal(false); readonly error=signal('');
  readonly userRoleSchema = userRoleSchema;
  readonly form=this.fb.group({ name: ['', [Validators.required]], email: ['', [Validators.required]], password: ['', [Validators.required]], role: ['', [Validators.required]] });
  private data(): any { const value = this.form.getRawValue(); return value; }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} this.saving.set(true); this.service.create(this.data()).subscribe({next:()=>{this.saving.set(false);this.router.navigate(['../'],{relativeTo:this.route});},error:()=>{this.saving.set(false);this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');}}); }
}
