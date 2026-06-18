import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { EditCategory } from '../../../api/models/categories.models';

interface CategoryAddModalState {
  saving: boolean;
  saveError: string | null;
  saveCompleted: boolean;
}

const initialState: CategoryAddModalState = {
  saving: false,
  saveError: null,
  saveCompleted: false,
};

export const CategoryAddModalStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(CategoriesApiService)) => ({
    create: rxMethod<EditCategory>(
      pipe(
        tap(() => patchState(store, { saving: true, saveError: null })),
        switchMap((data) =>
          api.create(data).pipe(
            tap(() => {
              patchState(store, { saving: false, saveCompleted: true });
            }),
            catchError(() => {
              patchState(store, { saving: false, saveError: 'Failed to create. Please try again.' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
