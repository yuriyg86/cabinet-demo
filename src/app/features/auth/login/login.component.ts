import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginStore } from './login.store';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoginStore],
  imports: [ReactiveFormsModule],
})
export class LoginComponent {
  protected readonly store = inject(LoginStore);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.login(this.form.getRawValue());
  }

  protected get loginControl() {
    return this.form.controls.login;
  }

  protected get passwordControl() {
    return this.form.controls.password;
  }
}
