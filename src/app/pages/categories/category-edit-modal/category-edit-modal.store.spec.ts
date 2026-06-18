import { createServiceFactory, mockProvider, SpectatorService, SpyObject } from '@ngneat/spectator/vitest';
import { NEVER, of, throwError } from 'rxjs';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { CategoryEditModalStore } from './category-edit-modal.store';

const mockCategory = { id: 1, name: 'Cat A', canEdit: true, canDelete: true };

describe(CategoryEditModalStore.name, () => {
  let spectator: SpectatorService<InstanceType<typeof CategoryEditModalStore>>;
  let api: SpyObject<CategoriesApiService>;

  const createService = createServiceFactory({
    service: CategoryEditModalStore,
    providers: [
      mockProvider(CategoriesApiService, {
        getById: vi.fn(() => NEVER),
        update: vi.fn(() => NEVER),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(CategoriesApiService) as SpyObject<CategoriesApiService>;
  });

  it('should have null category initially', () => {
    expect(spectator.service.category()).toBeNull();
  });

  it('should have saveCompleted as false initially', () => {
    expect(spectator.service.saveCompleted()).toBe(false);
  });

  describe('load', () => {
    it('should set loading to true while in-flight', () => {
      api.getById.mockReturnValueOnce(NEVER);
      spectator.service.load(1);
      expect(spectator.service.loading()).toBe(true);
    });

    it('should set category on success', () => {
      api.getById.mockReturnValueOnce(of(mockCategory));
      spectator.service.load(1);
      expect(spectator.service.category()).toEqual(mockCategory);
      expect(spectator.service.loading()).toBe(false);
    });

    it('should stop loading on error', () => {
      api.getById.mockReturnValueOnce(throwError(() => new Error()));
      spectator.service.load(1);
      expect(spectator.service.loading()).toBe(false);
      expect(spectator.service.category()).toBeNull();
    });
  });

  describe('save', () => {
    it('should set saving to true while in-flight', () => {
      api.update.mockReturnValueOnce(NEVER);
      spectator.service.save({ id: 1, data: { name: 'Updated' } });
      expect(spectator.service.saving()).toBe(true);
    });

    it('should set saveCompleted to true on success', () => {
      api.update.mockReturnValueOnce(of(undefined));
      spectator.service.save({ id: 1, data: { name: 'Updated' } });
      expect(spectator.service.saveCompleted()).toBe(true);
      expect(spectator.service.saving()).toBe(false);
    });

    it('should set saveError on failure', () => {
      api.update.mockReturnValueOnce(throwError(() => new Error()));
      spectator.service.save({ id: 1, data: { name: 'Updated' } });
      expect(spectator.service.saveError()).toBe('Failed to save. Please try again.');
      expect(spectator.service.saving()).toBe(false);
    });
  });
});
