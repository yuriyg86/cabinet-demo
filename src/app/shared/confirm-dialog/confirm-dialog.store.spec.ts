import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ConfirmDialogStore } from './confirm-dialog.store';

describe(ConfirmDialogStore.name, () => {
  let spectator: SpectatorService<ConfirmDialogStore>;

  const createService = createServiceFactory(ConfirmDialogStore);

  beforeEach(() => {
    spectator = createService();
  });

  it('should have isOpen as false initially', () => {
    expect(spectator.service.isOpen()).toBe(false);
  });

  it('should have empty message initially', () => {
    expect(spectator.service.message()).toBe('');
  });

  describe('open', () => {
    it('should set isOpen to true and store the message', () => {
      spectator.service.open('Are you sure?');
      expect(spectator.service.isOpen()).toBe(true);
      expect(spectator.service.message()).toBe('Are you sure?');
    });
  });

  describe('close', () => {
    it('should set isOpen to false and clear the message', () => {
      spectator.service.open('Delete item?');
      spectator.service.close();
      expect(spectator.service.isOpen()).toBe(false);
      expect(spectator.service.message()).toBe('');
    });
  });
});
