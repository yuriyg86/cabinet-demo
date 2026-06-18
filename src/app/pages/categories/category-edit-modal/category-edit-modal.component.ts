import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  untracked,
} from '@angular/core';
import { Observable, timer, switchMap, map } from 'rxjs';
import { CategoryEditModalStore } from './category-edit-modal.store';
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
  selector: 'app-category-edit-modal',
  templateUrl: './category-edit-modal.component.html',
  styleUrl: './category-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoryEditModalStore],
  imports: [ReactiveFormsModule],
})
export class CategoryEditModalComponent implements OnInit {
  readonly id = input.required<number>();
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly store = inject(CategoryEditModalStore);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CategoriesApiService);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', { validators: [Validators.required] }],
  });

  constructor() {
    effect(() => this.patchFormWhenCategoryLoaded());
    effect(() => this.emitWhenSaved());
  }

  ngOnInit(): void {
    const id = this.id();
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
    this.store.save({ id: this.id(), data: this.form.getRawValue() });
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
