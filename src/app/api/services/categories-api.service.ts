import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryList, CategoryListParams, EditCategory } from '../models/categories.models';
import { CategoriesService } from '../generated/api/categories.service';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly categoriesService = inject(CategoriesService);

  getList(params: CategoryListParams): Observable<CategoryList> {
    return this.categoriesService.getAll(
      params.search,
      params.pageSize,
      params.pageNumber,
      params.sortDesc,
    ) as Observable<CategoryList>;
  }

  getById(id: number): Observable<Category> {
    return this.categoriesService.getById(id) as Observable<Category>;
  }

  create(data: EditCategory): Observable<number> {
    return this.categoriesService.add(data);
  }

  update(id: number, data: EditCategory): Observable<void> {
    return this.categoriesService.update(id, data);
  }

  delete(id: number): Observable<void> {
    return this.categoriesService._delete(id);
  }

  nameExists(name: string, id: number | null): Observable<boolean> {
    return this.categoriesService.nameExists(name, id ?? undefined);
  }
}
