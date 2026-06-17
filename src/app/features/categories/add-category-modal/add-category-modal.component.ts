import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { CategoriesListStore } from '../categories-list/categories-list.store';
import { Observable, timer, switchMap, map } from 'rxjs';

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
  selector: 'app-add-category-modal',
  templateUrl: './add-category-modal.component.html',
  styleUrl: './add-category-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class AddCategoryModalComponent implements OnInit {
  protected readonly store = inject(CategoriesListStore);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CategoriesApiService);

  protected form = this.fb.nonNullable.group({
    name: ['', { validators: [Validators.required] }],
  });

  ngOnInit(): void {
    this.form.controls.name.addAsyncValidators(nameExistsValidator(this.api, null));
  }

  protected get nameControl() {
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
    this.store.createItem(this.form.getRawValue());
  }

  protected onCancel(): void {
    this.store.closeAddModal();
  }
}
