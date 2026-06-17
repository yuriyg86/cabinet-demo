import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { Category, EditCategory } from '../../../api/models/categories.models';

interface CategoryFormState {
  category: Category | null;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  saveError: string | null;
  deleteError: string | null;
}

const initialState: CategoryFormState = {
  category: null,
  loading: false,
  saving: false,
  deleting: false,
  saveError: null,
  deleteError: null,
};

interface SaveParams {
  id: number;
  data: EditCategory;
}

export const CategoryFormStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(CategoriesApiService), router = inject(Router)) => ({
    load: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, category: null })),
        switchMap((id) =>
          api.getById(id).pipe(
            tap((category) => {
              patchState(store, { category, loading: false });
            }),
            catchError(() => {
              patchState(store, { loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    save: rxMethod<SaveParams>(
      pipe(
        tap(() => patchState(store, { saving: true, saveError: null })),
        switchMap(({ id, data }) =>
          api.update(id, data).pipe(
            tap(() => {
              patchState(store, { saving: false });
              router.navigate(['/categories']);
            }),
            catchError(() => {
              patchState(store, { saving: false, saveError: 'Failed to save. Please try again.' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    delete: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { deleting: true, deleteError: null })),
        switchMap((id) =>
          api.delete(id).pipe(
            tap(() => {
              patchState(store, { deleting: false });
              router.navigate(['/categories']);
            }),
            catchError(() => {
              patchState(store, { deleting: false, deleteError: 'Failed to delete. Please try again.' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
