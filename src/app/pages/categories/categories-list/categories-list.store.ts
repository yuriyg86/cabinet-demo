import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { Category } from '../../../api/models/categories.models';

const pageSize = 20;

interface CategoriesListState {
  items: Category[];
  canAdd: boolean;
  loading: boolean;
  hasMore: boolean;
  search: string;
  sortDesc: boolean;
  page: number;
  deletingId: number | null;
  addModalOpen: boolean;
  editingId: number | null;
}

const initialState: CategoriesListState = {
  items: [],
  canAdd: false,
  loading: false,
  hasMore: true,
  search: '',
  sortDesc: false,
  page: 0,
  deletingId: null,
  addModalOpen: false,
  editingId: null,
};

interface LoadPageParams {
  search: string;
  sortDesc: boolean;
  page: number;
  append: boolean;
}

export const CategoriesListStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    isEmpty: computed(() => !store.loading() && store.items().length === 0),
  })),
  withMethods((store, api = inject(CategoriesApiService)) => ({
    setSearch(search: string): void {
      patchState(store, { search, page: 0, items: [], hasMore: true });
    },

    openAddModal(): void {
      patchState(store, { addModalOpen: true });
    },

    closeAddModal(): void {
      patchState(store, { addModalOpen: false });
    },

    loadPage: rxMethod<LoadPageParams>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(({ search, sortDesc, page, append }) =>
          api.getList({ search, sortDesc, pageSize, pageNumber: page }).pipe(
            tap((result) => {
              const items = append ? [...store.items(), ...result.items] : result.items;
              patchState(store, {
                items,
                canAdd: result.canAdd,
                loading: false,
                hasMore: result.items.length === pageSize,
              });
            }),
            catchError(() => {
              patchState(store, { loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    deleteItem: rxMethod<number>(
      pipe(
        tap((id) => patchState(store, { deletingId: id })),
        switchMap((id) =>
          api.delete(id).pipe(
            tap(() => {
              patchState(store, {
                items: store.items().filter((item) => item.id !== id),
                deletingId: null,
              });
            }),
            catchError(() => {
              patchState(store, { deletingId: null });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    openEditModal(id: number): void {
      patchState(store, { editingId: id });
    },

    closeEditModal(): void {
      patchState(store, { editingId: null });
    },
  })),
  withMethods((store) => ({
    loadNextPage(): void {
      if (store.loading() || !store.hasMore()) return;
      const page = store.page() + 1;
      patchState(store, { page });
      store.loadPage({ search: store.search(), sortDesc: store.sortDesc(), page, append: true });
    },

    loadFirstPage(): void {
      patchState(store, { page: 0, items: [], hasMore: true });
      store.loadPage({ search: store.search(), sortDesc: store.sortDesc(), page: 0, append: false });
    },

    toggleSort(): void {
      patchState(store, { sortDesc: !store.sortDesc(), page: 0, items: [], hasMore: true });
      this.loadFirstPage();
    },
  })),
);
