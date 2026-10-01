import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../index.service';
import { EnumSelectComponent } from '../../../shared/components/enum-select/index.component';
import { userRequestSchema, userRoleSchema } from '../index.schema';
@Component({ selector:'app-users-form', imports:[ReactiveFormsModule, EnumSelectComponent], templateUrl:'./index.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class UserFormComponent {
  private readonly fb=inject(FormBuilder); private readonly service=inject(UsersService);
  @Output() readonly created = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
  readonly saving=signal(false); readonly error=signal('');
  readonly userRoleSchema = userRoleSchema;
  readonly form=this.fb.group({ name: ['', [Validators.required]], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required]], role: ['', [Validators.required]] });
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const parsed = userRequestSchema.safeParse(this.form.getRawValue());
    if (!parsed.success) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    this.service.create(parsed.data).subscribe({
      next: () => { this.saving.set(false); this.created.emit(); },
      error: () => { this.saving.set(false); this.error.set('Não foi possível salvar. Confira os dados e tente novamente.'); },
    });
  }
}
