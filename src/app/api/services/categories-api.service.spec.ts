import { createServiceFactory, mockProvider, SpectatorService, SpyObject } from '@ngneat/spectator/vitest';
import { of } from 'rxjs';
import { CategoriesService } from '../generated/api/categories.service';
import { CategoriesApiService } from './categories-api.service';

describe(CategoriesApiService.name, () => {
  let spectator: SpectatorService<CategoriesApiService>;
  let categoriesService: SpyObject<CategoriesService>;

  const createService = createServiceFactory({
    service: CategoriesApiService,
    providers: [
      mockProvider(CategoriesService, {
        getAll: vi.fn(() => of({ items: [], canAdd: true })),
        getById: vi.fn(() => of({ id: 1, name: 'Cat', canEdit: true })),
        add: vi.fn(() => of(42)),
        update: vi.fn(() => of(undefined)),
        _delete: vi.fn(() => of(undefined)),
        nameExists: vi.fn(() => of(false)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    categoriesService = spectator.inject(CategoriesService) as SpyObject<CategoriesService>;
  });

  describe('getList', () => {
    it('should call CategoriesService.getAll with the correct params', () => {
      const params = { search: 'foo', pageSize: 20, pageNumber: 1, sortDesc: true };
      spectator.service.getList(params).subscribe();
      expect(categoriesService.getAll).toHaveBeenCalledWith('foo', 20, 1, true);
    });
  });

  describe('getById', () => {
    it('should call CategoriesService.getById with the id', () => {
      spectator.service.getById(5).subscribe();
      expect(categoriesService.getById).toHaveBeenCalledWith(5);
    });
  });

  describe('create', () => {
    it('should call CategoriesService.add with the data', () => {
      const data = { name: 'New cat' };
      spectator.service.create(data).subscribe();
      expect(categoriesService.add).toHaveBeenCalledWith(data);
    });
  });

  describe('update', () => {
    it('should call CategoriesService.update with id and data', () => {
      const data = { name: 'Updated' };
      spectator.service.update(3, data).subscribe();
      expect(categoriesService.update).toHaveBeenCalledWith(3, data);
    });
  });

  describe('delete', () => {
    it('should call CategoriesService._delete with the id', () => {
      spectator.service.delete(7).subscribe();
      expect(categoriesService._delete).toHaveBeenCalledWith(7);
    });
  });

  describe('nameExists', () => {
    it('should call CategoriesService.nameExists with name and id', () => {
      spectator.service.nameExists('Foo', 2).subscribe();
      expect(categoriesService.nameExists).toHaveBeenCalledWith('Foo', 2);
    });

    it('should pass undefined when id is null', () => {
      spectator.service.nameExists('Foo', null).subscribe();
      expect(categoriesService.nameExists).toHaveBeenCalledWith('Foo', undefined);
    });
  });
});
