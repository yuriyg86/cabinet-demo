import { createServiceFactory, mockProvider, SpectatorService, SpyObject } from '@ngneat/spectator/vitest';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { NEVER, of, throwError } from 'rxjs';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { CategoriesListStore } from './categories-list.store';

const mockItem = { id: 1, name: 'Cat A', canEdit: true, canDelete: true };
const mockItem2 = { id: 2, name: 'Cat B', canEdit: true, canDelete: true };

describe(CategoriesListStore.name, () => {
  let spectator: SpectatorService<InstanceType<typeof CategoriesListStore>>;
  let api: SpyObject<CategoriesApiService>;

  const createService = createServiceFactory({
    service: CategoriesListStore,
    providers: [
      mockProvider(CategoriesApiService, {
        getList: vi.fn(() => NEVER),
        delete: vi.fn(() => NEVER),
        create: vi.fn(() => NEVER),
      }),
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    spectator = createService();
    api = spectator.inject(CategoriesApiService) as SpyObject<CategoriesApiService>;
  });

  it('should have empty items initially', () => {
    expect(spectator.service.items()).toEqual([]);
  });

  describe('isEmpty computed', () => {
    it('should be true when not loading and items are empty', () => {
      expect(spectator.service.isEmpty()).toBe(true);
    });

    it('should be false when items exist', () => {
      patchState(unprotected(spectator.service), { items: [mockItem] });
      expect(spectator.service.isEmpty()).toBe(false);
    });

    it('should be false while loading', () => {
      patchState(unprotected(spectator.service), { loading: true });
      expect(spectator.service.isEmpty()).toBe(false);
    });
  });

  describe('setSearch', () => {
    it('should update search and reset page and items', () => {
      patchState(unprotected(spectator.service), { items: [mockItem], page: 3 });
      spectator.service.setSearch('foo');
      expect(spectator.service.search()).toBe('foo');
      expect(spectator.service.page()).toBe(0);
      expect(spectator.service.items()).toEqual([]);
    });
  });

  describe('toggleSort', () => {
    it('should toggle sortDesc and reset page and items', () => {
      patchState(unprotected(spectator.service), { sortDesc: false, items: [mockItem], page: 2 });
      spectator.service.toggleSort();
      expect(spectator.service.sortDesc()).toBe(true);
      expect(spectator.service.page()).toBe(0);
      expect(spectator.service.items()).toEqual([]);
    });

    it('should load page 0 with the new sortDesc value, not the old one', () => {
      patchState(unprotected(spectator.service), { sortDesc: false, search: 'x', page: 2 });
      api.getList.mockReturnValueOnce(NEVER);
      spectator.service.toggleSort();
      expect(api.getList).toHaveBeenCalledWith(
        expect.objectContaining({ sortDesc: true, pageNumber: 0 }),
      );
    });

    it('should load page 0 with append false, not continue from current page', () => {
      patchState(unprotected(spectator.service), { page: 3 });
      api.getList.mockReturnValueOnce(NEVER);
      spectator.service.toggleSort();
      expect(api.getList).toHaveBeenCalledWith(
        expect.objectContaining({ pageNumber: 0 }),
      );
      expect(api.getList).toHaveBeenCalledTimes(1);
    });
  });

  describe('openAddModal / closeAddModal', () => {
    it('should open and close the add modal', () => {
      spectator.service.openAddModal();
      expect(spectator.service.addModalOpen()).toBe(true);
      spectator.service.closeAddModal();
      expect(spectator.service.addModalOpen()).toBe(false);
    });
  });

  describe('openEditModal / closeEditModal', () => {
    it('should set and clear editingId', () => {
      spectator.service.openEditModal(5);
      expect(spectator.service.editingId()).toBe(5);
      spectator.service.closeEditModal();
      expect(spectator.service.editingId()).toBeNull();
    });
  });

  describe('loadPage', () => {
    it('should set loading to true while in-flight', () => {
      api.getList.mockReturnValueOnce(NEVER);
      spectator.service.loadPage({ search: '', sortDesc: false, page: 0, append: false });
      expect(spectator.service.loading()).toBe(true);
    });

    it('should replace items on non-append load', () => {
      api.getList.mockReturnValueOnce(of({ items: [mockItem], canAdd: true }));
      patchState(unprotected(spectator.service), { items: [mockItem2] });
      spectator.service.loadPage({ search: '', sortDesc: false, page: 0, append: false });
      expect(spectator.service.items()).toEqual([mockItem]);
    });

    it('should append items when append is true', () => {
      patchState(unprotected(spectator.service), { items: [mockItem2] });
      api.getList.mockReturnValueOnce(of({ items: [mockItem], canAdd: true }));
      spectator.service.loadPage({ search: '', sortDesc: false, page: 1, append: true });
      expect(spectator.service.items()).toEqual([mockItem2, mockItem]);
    });

    it('should set hasMore to false when result has fewer items than pageSize', () => {
      api.getList.mockReturnValueOnce(of({ items: [mockItem], canAdd: true }));
      spectator.service.loadPage({ search: '', sortDesc: false, page: 0, append: false });
      expect(spectator.service.hasMore()).toBe(false);
    });

    it('should stop loading and keep items on error', () => {
      api.getList.mockReturnValueOnce(throwError(() => new Error()));
      spectator.service.loadPage({ search: '', sortDesc: false, page: 0, append: false });
      expect(spectator.service.loading()).toBe(false);
    });
  });

  describe('deleteItem', () => {
    it('should set deletingId while in-flight', () => {
      api.delete.mockReturnValueOnce(NEVER);
      spectator.service.deleteItem(1);
      expect(spectator.service.deletingId()).toBe(1);
    });

    it('should remove the item from the list on success', () => {
      patchState(unprotected(spectator.service), { items: [mockItem, mockItem2] });
      api.delete.mockReturnValueOnce(of(undefined));
      spectator.service.deleteItem(1);
      expect(spectator.service.items()).toEqual([mockItem2]);
      expect(spectator.service.deletingId()).toBeNull();
    });

    it('should clear deletingId on error', () => {
      api.delete.mockReturnValueOnce(throwError(() => new Error()));
      spectator.service.deleteItem(1);
      expect(spectator.service.deletingId()).toBeNull();
    });
  });

  describe('loadNextPage', () => {
    it('should not load when already loading', () => {
      patchState(unprotected(spectator.service), { loading: true, hasMore: true });
      spectator.service.loadNextPage();
      expect(api.getList).not.toHaveBeenCalled();
    });

    it('should not load when hasMore is false', () => {
      patchState(unprotected(spectator.service), { hasMore: false });
      spectator.service.loadNextPage();
      expect(api.getList).not.toHaveBeenCalled();
    });
  });


});
