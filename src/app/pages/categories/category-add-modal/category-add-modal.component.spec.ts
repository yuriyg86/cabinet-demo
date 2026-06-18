import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/vitest';
import { NEVER, of } from 'rxjs';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { CategoryAddModalComponent } from './category-add-modal.component';

describe(CategoryAddModalComponent.name, () => {
  let spectator: Spectator<CategoryAddModalComponent>;

  const createComponent = createComponentFactory({
    component: CategoryAddModalComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(CategoriesApiService, {
        nameExists: vi.fn(() => of(false)),
        create: vi.fn(() => NEVER),
      }),
    ],
  });

  beforeEach(() => {
    vi.useFakeTimers();
    spectator = createComponent();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('nameErrorMessage getter', () => {
    it('should return null when control is pristine and untouched', () => {
      expect(spectator.component['nameErrorMessage']).toBeNull();
    });

    it('should return required error when name is empty and touched', () => {
      spectator.component['nameControl'].markAsTouched();
      expect(spectator.component['nameErrorMessage']).toBe('Name is required');
    });
  });

  describe('onSubmit', () => {
    it('should mark form touched and not call store when invalid', () => {
      const api = spectator.inject(CategoriesApiService);
      spectator.component['onSubmit']();
      expect(api.create).not.toHaveBeenCalled();
      expect(spectator.component['form'].touched).toBe(true);
    });

    it('should call store.create with form value when valid', () => {
      const api = spectator.inject(CategoriesApiService);
      api.create.mockReturnValueOnce(of(1));
      spectator.component['form'].setValue({ name: 'New Category' });
      vi.advanceTimersByTime(500);
      spectator.component['onSubmit']();
      expect(api.create).toHaveBeenCalledWith({ name: 'New Category' });
    });
  });

  describe('onCancel', () => {
    it('should emit closed', () => {
      const closedSpy = vi.fn();
      spectator.output('closed').subscribe(closedSpy);
      spectator.component['onCancel']();
      expect(closedSpy).toHaveBeenCalled();
    });
  });
});
