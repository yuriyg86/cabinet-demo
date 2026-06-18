import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  effect,
  viewChild,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { CategoriesListStore } from './categories-list.store';
import { ConfirmDialogStore } from '../../../shared/confirm-dialog/confirm-dialog.store';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { CategoryAddModalComponent } from '../category-add-modal/category-add-modal.component';
import { CategoryEditModalComponent } from '../category-edit-modal/category-edit-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoriesListStore, ConfirmDialogStore],
  imports: [ConfirmDialogComponent, CategoryAddModalComponent, CategoryEditModalComponent, FormsModule],
})
export class CategoriesListComponent implements OnInit, OnDestroy {
  protected readonly store = inject(CategoriesListStore);
  protected readonly confirmStore = inject(ConfirmDialogStore);

  private readonly injector = inject(Injector);
  private readonly scrollSentinel = viewChild<ElementRef<HTMLElement>>('scrollSentinel');
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();
  private intersectionObserver?: IntersectionObserver;

  protected pendingDeleteId = signal<number | null>(null);

  constructor() {
    afterNextRender(() => this.setupIntersectionObserver());
    effect(() => this.loadNextPageIfSentinelStillVisible());
  }

  ngOnInit(): void {
    this.store.loadFirstPage();

    this.searchInput$.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((search) => {
      this.store.setSearch(search);
      this.store.loadFirstPage();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
  }

  protected onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  protected onDeleteClick(id: number, name: string): void {
    this.pendingDeleteId.set(id);
    this.confirmStore.open(`Delete category "${name}"?`);
  }

  protected onDeleteConfirmed(): void {
    const id = this.pendingDeleteId();
    if (id !== null) {
      this.store.deleteItem(id);
    }
    this.confirmStore.close();
    this.pendingDeleteId.set(null);
  }

  protected onDeleteCancelled(): void {
    this.confirmStore.close();
    this.pendingDeleteId.set(null);
  }

  protected onEditModalClose(): void {
    this.store.closeEditModal();
  }

  protected onEditModalSaved(): void {
    this.store.closeEditModal();
    this.store.loadFirstPage();
  }

  protected onAddModalSaved(): void {
    this.store.closeAddModal();
    this.store.loadFirstPage();
  }

  protected onAddModalClosed(): void {
    this.store.closeAddModal();
  }


  private loadNextPageIfSentinelStillVisible(): void {
    const isLoading = this.store.loading();
    if (isLoading) return;

    untracked(() => {
      afterNextRender(
        () => {
          const sentinel = this.scrollSentinel()?.nativeElement;
          if (!sentinel || !this.store.hasMore()) return;

          const rect = sentinel.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
          if (isVisible) {
            this.store.loadNextPage();
          }
        },
        { injector: this.injector },
      );
    });
  }

  private setupIntersectionObserver(): void {
    const sentinel = this.scrollSentinel()?.nativeElement;
    if (!sentinel) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          this.store.loadNextPage();
        }
      },
      { threshold: 0.1 },
    );

    this.intersectionObserver.observe(sentinel);
  }
}
