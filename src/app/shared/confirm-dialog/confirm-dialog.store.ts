import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

interface ConfirmDialogState {
  isOpen: boolean;
  message: string;
}

const initialState: ConfirmDialogState = {
  isOpen: false,
  message: '',
};

export const ConfirmDialogStore = signalStore(
  withState(initialState),
  withMethods((store) => ({
    open(message: string): void {
      patchState(store, { isOpen: true, message });
    },
    close(): void {
      patchState(store, { isOpen: false, message: '' });
    },
  })),
);
