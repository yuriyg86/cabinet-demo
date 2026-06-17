import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, timer, switchMap, map } from 'rxjs';
import { CategoryFormStore } from './category-form.store';
import { ConfirmDialogStore } from '../../../shared/confirm-dialog/confirm-dialog.store';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { CategoriesApiService } from '../../../api/services/categories-api.service';

function nameExistsValidator(api: CategoriesApiService, currentId: number): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return timer(0).pipe(map(() => null));
    return timer(400).pipe(
      switchMap(() => api.nameExists(control.value as string, currentId)),
      map((exists) => (exists ? { nameTaken: true } : null)),
    );
  };
}

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryFormStore, ConfirmDialogStore],
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
})
export class CategoryFormComponent implements OnInit {
  protected readonly store = inject(CategoryFormStore);
  protected readonly confirmStore = inject(ConfirmDialogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CategoriesApiService);

  protected readonly categoryId = signal<number>(0);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', { validators: [Validators.required] }],
  });

  constructor() {
    effect(() => this.patchFormWhenCategoryLoaded());
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.categoryId.set(id);
    this.store.load(id);
    this.form.controls.name.addAsyncValidators(nameExistsValidator(this.api, id));
  }

  private patchFormWhenCategoryLoaded(): void {
    const category = this.store.category();
    if (!category) return;

    untracked(() => {
      this.form.patchValue({ name: category.name });
      if (!category.canEdit) {
        this.form.disable();
      }
    });
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
    this.store.save({ id: this.categoryId(), data: this.form.getRawValue() });
  }

  protected onDeleteClick(): void {
    this.confirmStore.open(`Delete category "${this.store.category()?.name}"?`);
  }

  protected onDeleteConfirmed(): void {
    this.confirmStore.close();
    this.store.delete(this.categoryId());
  }

  protected onDeleteCancelled(): void {
    this.confirmStore.close();
  }

  protected onBack(): void {
    this.router.navigate(['/categories']);
  }
}
