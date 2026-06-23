import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { SpringPage } from '../models/page.model';
import type { Delivery, DeliveryCreateRequest, DeliveryUpdateRequest } from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private baseUrl = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  /**
   * {@code GET /deliveries?page=&size=&sort=field,dir&search=}
   * Search matches address, status name, or order id (substring).
   */
  getPage(
    page: number,
    size: number,
    sortField: string,
    direction: 'asc' | 'desc',
    search: string
  ): Observable<SpringPage<Delivery>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', `${sortField},${direction}`);
    const q = search?.trim();
    if (q) {
      params = params.set('search', q);
    }
    return this.http.get<SpringPage<Delivery>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.baseUrl}/${id}`);
  }

  create(orderId: number, request: DeliveryCreateRequest): Observable<Delivery> {
    return this.http.post<Delivery>(`${this.baseUrl}/${orderId}`, request);
  }

  update(id: number, request: DeliveryUpdateRequest): Observable<Delivery> {
    return this.http.put<Delivery>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/${id}`, { observe: 'response' })
      .pipe(map(() => undefined));
  }
}
