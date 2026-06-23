import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { parseHttpError } from '../../../core/utils/http-error.util';
import { DeliveryService } from '../../../core/services/delivery.service';
import { OrderService } from '../../../core/services/order.service';
import type { SpringPage } from '../../../core/models/page.model';
import type {
  Delivery,
  DeliveryCreateRequest,
  DeliveryStatus,
  DeliveryUpdateRequest
} from '../../../core/models/delivery.model';
import { DELIVERY_STATUS_OPTIONS } from '../../../core/models/delivery.model';
import type { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-delivery-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-list.component.html',
  styleUrls: ['./delivery-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryListComponent implements OnInit, OnDestroy {
  deliveries: Delivery[] = [];
  pageMeta: SpringPage<Delivery> | null = null;

  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  sortField: 'deliveryDate' | 'status' | 'orderId' | 'address' = 'deliveryDate';
  sortDir: 'asc' | 'desc' = 'desc';

  searchQuery = '';
  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  readonly statusOptions = DELIVERY_STATUS_OPTIONS;

  /** Orders for “new delivery” dropdown (recent page). */
  orderChoices: Order[] = [];
  isLoadingOrders = false;

  showForm = false;
  formMode: 'create' | 'edit' | null = null;
  editingDeliveryId: number | null = null;

  formOrderId: number | null = null;
  formAddress = '';
  formStatus: DeliveryStatus = 'PENDING';
  /** datetime-local value (yyyy-MM-ddTHH:mm) */
  formDeliveryDateLocal = '';

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.search$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDeliveries();
      });
    this.loadDeliveries();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(): void {
    this.search$.next(this.searchQuery);
  }

  /** Spring Data sort property (nested for order id). */
  private sortParam(): string {
    if (this.sortField === 'orderId') {
      return 'order.id';
    }
    return this.sortField;
  }

  loadOrderChoices(): void {
    this.isLoadingOrders = true;
    this.cdr.markForCheck();
    this.orderService.getPage(0, 100, 'orderDate', 'desc', '').subscribe({
      next: (page) => {
        this.orderChoices = page.content ?? [];
        this.isLoadingOrders = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to load orders for dropdown');
        this.isLoadingOrders = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadDeliveries(): void {
    this.deliveryService
      .getPage(this.pageIndex, this.pageSize, this.sortParam(), this.sortDir, this.searchQuery)
      .subscribe({
        next: (page) => {
          this.pageMeta = page;
          this.deliveries = page.content ?? [];
          if (!this.deliveries.length && (page.totalElements ?? 0) > 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.loadDeliveries();
            return;
          }
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(
            err,
            'Failed to load deliveries. Ensure the gateway routes /deliveries to product-order-service.'
          );
          this.cdr.markForCheck();
        }
      });
  }

  toggleSort(field: 'deliveryDate' | 'status' | 'orderId' | 'address'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      if (field === 'deliveryDate') {
        this.sortDir = 'desc';
      } else {
        this.sortDir = 'asc';
      }
    }
    this.pageIndex = 0;
    this.loadDeliveries();
  }

  sortIndicator(field: 'deliveryDate' | 'status' | 'orderId' | 'address'): string {
    if (this.sortField !== field) return '';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  goToPage(i: number): void {
    const max = Math.max(0, (this.pageMeta?.totalPages ?? 1) - 1);
    this.pageIndex = Math.min(Math.max(0, i), max);
    this.loadDeliveries();
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.loadDeliveries();
  }

  get totalElements(): number {
    return this.pageMeta?.totalElements ?? 0;
  }

  get totalPages(): number {
    return this.pageMeta?.totalPages ?? 0;
  }

  get first(): boolean {
    return this.pageMeta?.first ?? true;
  }

  get last(): boolean {
    return this.pageMeta?.last ?? true;
  }

  get rangeStart(): number {
    if (!this.totalElements) return 0;
    return this.pageIndex * this.pageSize + 1;
  }

  get rangeEnd(): number {
    if (!this.totalElements) return 0;
    return Math.min(this.pageIndex * this.pageSize + this.deliveries.length, this.totalElements);
  }

  openCreateForm(): void {
    this.clearMessages();
    this.formMode = 'create';
    this.editingDeliveryId = null;
    this.formOrderId = null;
    this.formAddress = '';
    this.formStatus = 'PENDING';
    this.formDeliveryDateLocal = '';
    this.showForm = true;
    this.loadOrderChoices();
    this.cdr.markForCheck();
  }

  openEditForm(d: Delivery): void {
    this.clearMessages();
    this.formMode = 'edit';
    this.editingDeliveryId = d.id;
    this.isSubmitting = true;
    this.showForm = false;
    this.cdr.markForCheck();

    this.deliveryService.getById(d.id).subscribe({
      next: (full) => {
        this.formAddress = full.address ?? '';
        this.formStatus = full.status;
        this.formDeliveryDateLocal = this.toDatetimeLocalValue(full.deliveryDate);
        this.showForm = true;
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to load delivery');
        this.isSubmitting = false;
        this.formMode = null;
        this.editingDeliveryId = null;
        this.cdr.markForCheck();
      }
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isSubmitting = false;
    this.formMode = null;
    this.editingDeliveryId = null;
    this.clearMessages();
    this.cdr.markForCheck();
  }

  submitForm(): void {
    if (this.formMode === 'edit') {
      this.updateDelivery();
    } else {
      this.createDelivery();
    }
  }

  private createDelivery(): void {
    this.clearMessages();
    if (this.formOrderId == null || this.formOrderId <= 0) {
      this.errorMessage = 'Select an order';
      this.cdr.markForCheck();
      return;
    }
    const addr = this.formAddress?.trim();
    if (!addr) {
      this.errorMessage = 'Address is required';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const payload: DeliveryCreateRequest = {
      address: addr,
      status: this.formStatus
    };
    const iso = this.fromDatetimeLocalValue(this.formDeliveryDateLocal);
    if (iso) {
      payload.deliveryDate = iso;
    }

    this.deliveryService
      .create(this.formOrderId, payload)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.successMessage = 'Delivery created successfully.';
          this.isSubmitting = false;
          setTimeout(() => {
            this.pageIndex = 0;
            this.loadDeliveries();
            this.closeForm();
          }, 400);
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(err, 'Failed to create delivery');
          this.isSubmitting = false;
        }
      });
  }

  private updateDelivery(): void {
    if (this.editingDeliveryId == null) return;
    this.clearMessages();
    const addr = this.formAddress?.trim();
    if (!addr) {
      this.errorMessage = 'Address is required';
      this.cdr.markForCheck();
      return;
    }
    const iso = this.fromDatetimeLocalValue(this.formDeliveryDateLocal);
    if (!iso) {
      this.errorMessage = 'Delivery date is required';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const payload: DeliveryUpdateRequest = {
      deliveryDate: iso,
      address: addr,
      status: this.formStatus
    };

    this.deliveryService
      .update(this.editingDeliveryId, payload)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.successMessage = 'Delivery updated successfully.';
          this.isSubmitting = false;
          setTimeout(() => {
            this.loadDeliveries();
            this.closeForm();
          }, 400);
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(err, 'Failed to update delivery');
          this.isSubmitting = false;
        }
      });
  }

  delete(id: number): void {
    if (!confirm('Delete this delivery?')) return;
    this.clearMessages();
    this.deliveryService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Delivery deleted.';
        this.loadDeliveries();
        this.cdr.markForCheck();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to delete delivery');
        this.cdr.markForCheck();
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  statusLabel(value: DeliveryStatus): string {
    return this.statusOptions.find((o) => o.value === value)?.label ?? value;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  hasPromo(address: string | undefined): boolean {
    if (!address) return false;
    return address.includes('[PROMO:');
  }

  getPromoBadge(address: string | undefined): string {
    if (!address) return '';
    const match = address.match(/\[PROMO: (.*?)\]/);
    return match ? match[1] : '';
  }

  getCleanAddress(address: string | undefined): string {
    if (!address) return '';
    return address.replace(/\[PROMO: .*?\]/, '').trim();
  }

  /** Build value for &lt;input type="datetime-local"&gt; in local timezone. */
  private toDatetimeLocalValue(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Returns ISO string for backend or empty if invalid/empty. */
  private fromDatetimeLocalValue(local: string): string | null {
    if (!local?.trim()) return null;
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }
}
