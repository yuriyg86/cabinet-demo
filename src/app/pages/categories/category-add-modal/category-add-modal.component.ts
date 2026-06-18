import { ChangeDetectionStrategy, Component, effect, inject, OnInit, output, untracked } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { Observable, timer, switchMap, map } from 'rxjs';
import { CategoryAddModalStore } from './category-add-modal.store';

function nameExistsValidator(api: CategoriesApiService, id: number | null): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return timer(0).pipe(map(() => null));
    return timer(400).pipe(
      switchMap(() => api.nameExists(control.value as string, id)),
      map((exists) => (exists ? { nameTaken: true } : null)),
    );
  };
}

@Component({
  selector: 'app-category-add-modal',
  templateUrl: './category-add-modal.component.html',
  styleUrl: './category-add-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryAddModalStore],
  imports: [ReactiveFormsModule],
})
export class CategoryAddModalComponent implements OnInit {
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly store = inject(CategoryAddModalStore);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CategoriesApiService);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', { validators: [Validators.required] }],
  });

  constructor() {
    effect(() => this.emitWhenSaved());
  }

  ngOnInit(): void {
    this.form.controls.name.addAsyncValidators(nameExistsValidator(this.api, null));
  }

  private emitWhenSaved(): void {
    if (!this.store.saveCompleted()) return;
    untracked(() => this.saved.emit());
  }

  protected get nameControl(): FormControl<string> {
    return this.form.controls.name;
  }

  protected get nameErrorMessage(): string | null {
    const ctrl = this.nameControl;
    if (!ctrl.touched && !ctrl.dirty) return null;
    if (ctrl.hasError('required')) return 'Name is required';
    if (ctrl.hasError('nameTaken')) return 'This name is already taken';
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.create(this.form.getRawValue());
  }

  protected onCancel(): void {
    this.closed.emit();
  }
}
