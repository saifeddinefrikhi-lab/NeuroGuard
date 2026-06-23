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
import { ProductService } from '../../../core/services/product.service';
import type { SpringPage } from '../../../core/models/page.model';
import type { Product, ProductRequest } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  pageMeta: SpringPage<Product> | null = null;

  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  sortField: 'name' | 'price' | 'stock' = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  searchQuery = '';
  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  selected: Product | null = null;
  showForm = false;
  isEditing = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  formData: ProductRequest = {
    name: '',
    price: 0,
    stock: 0
  };

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.search$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadProducts();
      });
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadProducts(): void {
    this.productService
      .getPage(this.pageIndex, this.pageSize, this.sortField, this.sortDir, this.searchQuery)
      .subscribe({
        next: (page) => {
          this.pageMeta = page;
          this.products = page.content ?? [];
          if (!this.products.length && (page.totalElements ?? 0) > 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.loadProducts();
            return;
          }
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(
            err,
            'Failed to load products. Is the gateway routing /products to product-order-service (port 8095)?'
          );
          this.cdr.markForCheck();
        }
      });
  }

  onSearchInput(): void {
    this.search$.next(this.searchQuery);
  }

  toggleSort(field: 'name' | 'price' | 'stock'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = field === 'price' || field === 'stock' ? 'desc' : 'asc';
    }
    this.pageIndex = 0;
    this.loadProducts();
  }

  sortIndicator(field: 'name' | 'price' | 'stock'): string {
    if (this.sortField !== field) return '';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  goToPage(i: number): void {
    const max = Math.max(0, (this.pageMeta?.totalPages ?? 1) - 1);
    this.pageIndex = Math.min(Math.max(0, i), max);
    this.loadProducts();
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.loadProducts();
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
    return Math.min(this.pageIndex * this.pageSize + this.products.length, this.totalElements);
  }

  openCreateForm(): void {
    this.clearMessages();
    this.selected = null;
    this.isEditing = false;
    this.formData = { name: '', price: 0, stock: 0 };
    this.showForm = true;
    this.cdr.markForCheck();
  }

  openEditForm(p: Product): void {
    this.clearMessages();
    this.selected = p;
    this.isEditing = true;
    this.formData = { name: p.name, price: p.price, stock: p.stock };
    this.showForm = true;
    this.cdr.markForCheck();
  }

  closeForm(): void {
    this.showForm = false;
    this.isSubmitting = false;
    this.clearMessages();
    this.cdr.markForCheck();
  }

  save(): void {
    this.clearMessages();
    this.isSubmitting = true;
    this.cdr.markForCheck();

    if (!this.formData.name?.trim()) {
      this.errorMessage = 'Name is required';
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }

    const price = Number(this.formData.price);
    if (!Number.isFinite(price) || price < 0) {
      this.errorMessage = 'Price must be a valid number ≥ 0';
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }
    const stockInt = parseInt(String(this.formData.stock), 10);
    if (Number.isNaN(stockInt) || stockInt < 0) {
      this.errorMessage = 'Stock must be a valid integer ≥ 0';
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }

    const payload: ProductRequest = {
      name: this.formData.name.trim(),
      price,
      stock: stockInt
    };

    if (this.isEditing && this.selected) {
      this.productService
        .update(this.selected.id, payload)
        .pipe(finalize(() => this.cdr.markForCheck()))
        .subscribe({
          next: () => {
            this.successMessage = 'Product updated successfully!';
            this.isSubmitting = false;
            setTimeout(() => {
              this.loadProducts();
              this.closeForm();
            }, 400);
          },
          error: (err: unknown) => {
            this.errorMessage = parseHttpError(err, 'Failed to update product');
            this.isSubmitting = false;
          }
        });
      return;
    }

    this.productService
      .create(payload)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.successMessage = 'Product created successfully!';
          this.isSubmitting = false;
          setTimeout(() => {
            this.pageIndex = 0;
            this.loadProducts();
            this.closeForm();
          }, 400);
        },
        error: (err: unknown) => {
          this.errorMessage = parseHttpError(err, 'Failed to create product');
          this.isSubmitting = false;
        }
      });
  }

  delete(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.clearMessages();
    this.productService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully!';
        this.loadProducts();
        this.cdr.markForCheck();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (err: unknown) => {
        this.errorMessage = parseHttpError(err, 'Failed to delete product');
        this.cdr.markForCheck();
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
