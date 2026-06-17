import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe(ConfirmDialogComponent.name, () => {
  let spectator: Spectator<ConfirmDialogComponent>;

  const createComponent = createComponentFactory({
    component: ConfirmDialogComponent,
  });

  beforeEach(() => {
    spectator = createComponent({ props: { message: 'Are you sure?' } });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('confirmed output', () => {
    it('should emit when onConfirm is called', () => {
      const confirmedSpy = jest.fn();
      spectator.output('confirmed').subscribe(confirmedSpy);
      spectator.component.onConfirm();
      expect(confirmedSpy).toHaveBeenCalled();
    });
  });

  describe('cancelled output', () => {
    it('should emit when onCancel is called', () => {
      const cancelledSpy = jest.fn();
      spectator.output('cancelled').subscribe(cancelledSpy);
      spectator.component.onCancel();
      expect(cancelledSpy).toHaveBeenCalled();
    });
  });
});
