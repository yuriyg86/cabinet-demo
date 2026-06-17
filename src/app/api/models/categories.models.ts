export interface CategoryListItem {
  id: number;
  name: string;
}

export interface CategoryList {
  canAdd: boolean;
  items: CategoryListItem[];
}

export interface Category {
  id: number;
  name: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface EditCategory {
  name: string;
}

export interface CategoryListParams {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  sortDesc?: boolean;
}
