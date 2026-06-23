import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { SpringPage } from '../models/page.model';
import type { Product, ProductRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  /**
   * Paginated list: {@code GET /products?page=&size=&sort=field,dir&search=}
   */
  getPage(
    page: number,
    size: number,
    sortField: string,
    direction: 'asc' | 'desc',
    search: string
  ): Observable<SpringPage<Product>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', `${sortField},${direction}`);
    const q = search?.trim();
    if (q) {
      params = params.set('search', q);
    }
    return this.http.get<SpringPage<Product>>(this.baseUrl, { params });
  }

  /** Large page for dropdowns (e.g. order form). */
  getAllForSelect(): Observable<Product[]> {
    return this.getPage(0, 500, 'name', 'asc', '').pipe(map((p) => p.content ?? []));
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(request: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, request);
  }

  update(id: number, request: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/${id}`, { observe: 'response' })
      .pipe(map(() => undefined));
  }
}
