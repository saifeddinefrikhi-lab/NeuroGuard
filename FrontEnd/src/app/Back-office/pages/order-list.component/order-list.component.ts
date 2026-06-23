import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { parseHttpError } from '../../../core/utils/http-error.util';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import type { SpringPage } from '../../../core/models/page.model';
import type {
  Order,
  OrderCreateRequest,
  OrderLineItemRequest,
  OrderUpdateRequest
} from '../../../core/models/order.model';
import type { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-order-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  pageMeta: SpringPage<Order> | null = null;

  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  sortField: 'orderDate' | 'total' | 'status' = 'orderDate';
  sortDir: 'asc' | 'desc' = 'desc';

  searchQuery = '';
  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  products: Product[] = [];

  showForm = false;
  /** create = new order modal; edit = update existing */
  formMode: 'create' | 'edit' | null = null;
  editingOrderId: number | null = null;

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  formStatus = 'NEW';
  formPromoCode='';
  formLines: OrderLineItemRequest[] = [{ productId: 0, quantity: 1 }];

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.search$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadOrders();
      });
    this.loadProductsForForm();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadProductsForForm(): void {
    this.productService.getAllForSelect().subscribe({
      next: (data) => {
        this.products = data ?? [];
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to load products for order form');
        this.cdr.markForCheck();
      }
    });
  }

  loadOrders(): void {
    this.orderService
      .getPage(this.pageIndex, this.pageSize, this.sortField, this.sortDir, this.searchQuery)
      .subscribe({
        next: (page) => {
          this.pageMeta = page;
          this.orders = page.content ?? [];
          if (!this.orders.length && (page.totalElements ?? 0) > 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.loadOrders();
            return;
          }
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(
            err,
            'Failed to load orders. Is the gateway routing /orders to product-order-service (port 8095)?'
          );
          this.cdr.markForCheck();
        }
      });
  }

  onSearchInput(): void {
    this.search$.next(this.searchQuery);
  }

  toggleSort(field: 'orderDate' | 'total' | 'status'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = field === 'orderDate' || field === 'total' ? 'desc' : 'asc';
    }
    this.pageIndex = 0;
    this.loadOrders();
  }

  sortIndicator(field: 'orderDate' | 'total' | 'status'): string {
    if (this.sortField !== field) return '';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  goToPage(i: number): void {
    const max = Math.max(0, (this.pageMeta?.totalPages ?? 1) - 1);
    this.pageIndex = Math.min(Math.max(0, i), max);
    this.loadOrders();
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.loadOrders();
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
    return Math.min(this.pageIndex * this.pageSize + this.orders.length, this.totalElements);
  }

  openCreateForm(): void {
    this.clearMessages();
    this.loadProductsForForm();
    this.formMode = 'create';
    this.editingOrderId = null;
    this.formStatus = 'NEW';
    this.formLines = [{ productId: 0, quantity: 1 }];
    this.formPromoCode='';
    this.showForm = true;
    this.cdr.markForCheck();
  }

  openEditForm(o: Order): void {
    this.clearMessages();
    this.loadProductsForForm();
    this.formMode = 'edit';
    this.editingOrderId = o.id;
    this.isSubmitting = true;
    this.showForm = false;
    this.cdr.markForCheck();

    this.orderService.getById(o.id).subscribe({
      next: (full) => {
        this.formStatus = full.status?.trim() ? full.status : 'NEW';
        this.formPromoCode=full.appliedPromoCode?.trim() ? full.appliedPromoCode:'';
        const lines = full.lines ?? [];
        this.formLines =
          lines.length > 0
            ? lines.map((l) => ({
                productId: l.product?.id ?? 0,
                quantity: l.quantity
              }))
            : [{ productId: 0, quantity: 1 }];
        this.showForm = true;
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to load order');
        this.isSubmitting = false;
        this.formMode = null;
        this.editingOrderId = null;
        this.cdr.markForCheck();
      }
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isSubmitting = false;
    this.formMode = null;
    this.editingOrderId = null;
    this.clearMessages();
    this.cdr.markForCheck();
  }

  addLine(): void {
    this.formLines.push({ productId: 0, quantity: 1 });
    this.cdr.markForCheck();
  }

  removeLine(idx: number): void {
    this.formLines.splice(idx, 1);
    if (this.formLines.length === 0) this.formLines.push({ productId: 0, quantity: 1 });
    this.cdr.markForCheck();
  }

  submitOrder(): void {
    if (this.formMode === 'edit') {
      this.updateOrder();
    } else {
      this.create();
    }
  }

  private buildLinesPayload(): OrderLineItemRequest[] {
    return this.formLines
      .map((l) => ({ productId: Number(l.productId), quantity: Number(l.quantity) }))
      .filter((l) => l.productId > 0 && l.quantity > 0);
  }

  create(): void {
    this.clearMessages();
    this.isSubmitting = true;
    this.cdr.markForCheck();

    const lines = this.buildLinesPayload();
    if (lines.length === 0) {
      this.errorMessage = 'Add at least one valid order line';
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }

    const payload: OrderCreateRequest = {
      status: this.formStatus?.trim() ? this.formStatus.trim() : 'NEW',
      lines,
      appliedPromoCode:this.formPromoCode
    };

    this.orderService
      .create(payload)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.successMessage = 'Order created successfully!';
          this.isSubmitting = false;
          setTimeout(() => {
            this.pageIndex = 0;
            this.loadOrders();
            this.closeForm();
          }, 400);
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(err, 'Failed to create order');
          this.isSubmitting = false;
        }
      });
  }

  private updateOrder(): void {
    if (this.editingOrderId == null) return;

    this.clearMessages();
    this.isSubmitting = true;
    this.cdr.markForCheck();

    const lines = this.buildLinesPayload();
    if (lines.length === 0) {
      this.errorMessage = 'Add at least one valid line';
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }

    const payload: OrderUpdateRequest = {
      status: this.formStatus?.trim() ? this.formStatus.trim() : 'NEW',
      lines,
      appliedPromoCode:this.formPromoCode
    };

    this.orderService
      .update(this.editingOrderId, payload)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.successMessage = 'Order updated successfully!';
          this.isSubmitting = false;
          setTimeout(() => {
            this.loadOrders();
            this.closeForm();
          }, 400);
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(err, 'Failed to update order');
          this.isSubmitting = false;
        }
      });
  }

  delete(id: number): void {
    if (!confirm('Are you sure you want to delete this order?')) return;
    this.clearMessages();
    this.orderService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Order deleted successfully!';
        this.loadOrders();
        this.cdr.markForCheck();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to delete order');
        this.cdr.markForCheck();
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  linesCount(order: Order): number {
    return order?.lines?.length ?? 0;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
