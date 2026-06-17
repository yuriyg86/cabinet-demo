export type { ZidiumWebServiceFrontCategoryDto as Category } from '../generated/model/zidiumWebServiceFrontCategoryDto';
export type { ZidiumWebServiceFrontCategoryListDto as CategoryList } from '../generated/model/zidiumWebServiceFrontCategoryListDto';
export type { ZidiumWebServiceFrontEditCategoryDto as EditCategory } from '../generated/model/zidiumWebServiceFrontEditCategoryDto';

export interface CategoryListParams {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  sortDesc?: boolean;
}
