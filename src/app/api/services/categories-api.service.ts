import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryList, CategoryListParams, EditCategory } from '../models/categories.models';

const apiBase = 'https://zidium3-backend.zidium.net';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);

  getList(params: CategoryListParams): Observable<CategoryList> {
    let httpParams = new HttpParams();
    if (params.search != null) httpParams = httpParams.set('search', params.search);
    if (params.pageSize != null) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.pageNumber != null) httpParams = httpParams.set('pageNumber', params.pageNumber);
    if (params.sortDesc != null) httpParams = httpParams.set('sortDesc', params.sortDesc);
    return this.http.get<CategoryList>(`${apiBase}/front/categories`, { params: httpParams });
  }

  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${apiBase}/front/categories/${id}`);
  }

  create(data: EditCategory): Observable<number> {
    return this.http.post<number>(`${apiBase}/front/categories`, data);
  }

  update(id: number, data: EditCategory): Observable<void> {
    return this.http.post<void>(`${apiBase}/front/categories/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${apiBase}/front/categories/${id}`);
  }

  nameExists(name: string, id: number | null): Observable<boolean> {
    let params = new HttpParams().set('name', name);
    if (id != null) params = params.set('id', id);
    return this.http.get<boolean>(`${apiBase}/front/categories/name-exists`, { params });
  }
}
