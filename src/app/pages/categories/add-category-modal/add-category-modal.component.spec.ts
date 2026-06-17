import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { CategoriesApiService } from '../../../api/services/categories-api.service';
import { AddCategoryModalComponent } from './add-category-modal.component';

describe(AddCategoryModalComponent.name, () => {
  let spectator: Spectator<AddCategoryModalComponent>;

  const createComponent = createComponentFactory({
    component: AddCategoryModalComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(CategoriesApiService, { nameExists: jest.fn(() => of(false)) }),
    ],
  });

  beforeEach(() => {
    jest.useFakeTimers();
    spectator = createComponent({ props: { saving: false } });
  });

  afterEach(() => {
    jest.useRealTimers();
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
    it('should mark form touched and not emit when invalid', () => {
      const submittedSpy = jest.fn();
      spectator.output('submitted').subscribe(submittedSpy);
      spectator.component['onSubmit']();
      expect(submittedSpy).not.toHaveBeenCalled();
      expect(spectator.component['form'].touched).toBe(true);
    });

    it('should emit submitted with form value when valid', () => {
      const submittedSpy = jest.fn();
      spectator.output('submitted').subscribe(submittedSpy);
      spectator.component['form'].setValue({ name: 'New Category' });
      jest.advanceTimersByTime(500);
      spectator.component['onSubmit']();
      expect(submittedSpy).toHaveBeenCalledWith({ name: 'New Category' });
    });
  });

  describe('onCancel', () => {
    it('should emit cancelled', () => {
      const cancelledSpy = jest.fn();
      spectator.output('cancelled').subscribe(cancelledSpy);
      spectator.component['onCancel']();
      expect(cancelledSpy).toHaveBeenCalled();
    });
  });
});
