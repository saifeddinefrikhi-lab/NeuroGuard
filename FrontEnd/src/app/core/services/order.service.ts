import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { SpringPage } from '../models/page.model';
import type { Order, OrderCreateRequest, OrderUpdateRequest } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Paginated list: {@code GET /orders?page=&size=&sort=field,dir&search=}
   * Search filters by status (contains, case-insensitive).
   */
  getPage(
    page: number,
    size: number,
    sortField: string,
    direction: 'asc' | 'desc',
    search: string
  ): Observable<SpringPage<Order>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', `${sortField},${direction}`);
    const q = search?.trim();
    if (q) {
      params = params.set('search', q);
    }
    return this.http.get<SpringPage<Order>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  create(request: OrderCreateRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, request);
  }

  update(id: number, request: OrderUpdateRequest): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/${id}`, { observe: 'response' })
      .pipe(map(() => undefined));
  }
}
