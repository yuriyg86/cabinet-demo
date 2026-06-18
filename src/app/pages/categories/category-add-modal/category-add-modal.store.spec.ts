import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { NEVER, of, throwError } from 'rxjs';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { CategoryAddModalStore } from './category-add-modal.store';

describe(CategoryAddModalStore.name, () => {
  let spectator: SpectatorService<InstanceType<typeof CategoryAddModalStore>>;
  let api: jest.Mocked<CategoriesApiService>;

  const createService = createServiceFactory({
    service: CategoryAddModalStore,
    providers: [
      mockProvider(CategoriesApiService, {
        create: jest.fn(() => NEVER),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(CategoriesApiService) as jest.Mocked<CategoriesApiService>;
  });

  it('should have saveCompleted as false initially', () => {
    expect(spectator.service.saveCompleted()).toBe(false);
  });

  it('should have saveError as null initially', () => {
    expect(spectator.service.saveError()).toBeNull();
  });

  describe('create', () => {
    it('should set saving to true while in-flight', () => {
      api.create.mockReturnValueOnce(NEVER);
      spectator.service.create({ name: 'New' });
      expect(spectator.service.saving()).toBe(true);
    });

    it('should set saveCompleted to true on success', () => {
      api.create.mockReturnValueOnce(of(1));
      spectator.service.create({ name: 'New' });
      expect(spectator.service.saveCompleted()).toBe(true);
      expect(spectator.service.saving()).toBe(false);
    });

    it('should set saveError on failure', () => {
      api.create.mockReturnValueOnce(throwError(() => new Error()));
      spectator.service.create({ name: 'New' });
      expect(spectator.service.saveError()).toBe('Failed to create. Please try again.');
      expect(spectator.service.saving()).toBe(false);
    });
  });
});
