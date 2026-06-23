import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ForumService } from '../../core/services/forum.service';
import { CreatePostRequest, UpdatePostRequest, CategoryDto, DEFAULT_FORUM_CATEGORIES } from '../../core/models/post.dto';
import { PostDto } from '../../core/models/post.dto';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss']
})
export class PostFormComponent implements OnInit, OnDestroy {
  postForm: FormGroup;
  categories: CategoryDto[] = [];
  isEdit = false;
  postId?: number;
  /** Set after create or when editing; used for image list and upload */
  currentPost: PostDto | null = null;
  /** True after creating a new post (stay on form to add images) */
  createdJustNow = false;
  loading = false;
  error = '';
  uploadingImages = false;
  imageUploadError = '';
  /** Files selected on new post form (uploaded after create) */
  pendingImageFiles: File[] = [];
  /** Object URLs for preview; revoke in removePendingImage and on destroy */
  pendingPreviewUrls: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public forumService: ForumService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: [null as number | null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.postId = +id;
      this.loadPost();
    }
  }

  ngOnDestroy(): void {
    this.revokePendingPreviews();
  }

  loadCategories(): void {
    this.forumService.getCategories().subscribe({
      next: (list) => {
        this.categories = list?.length ? list : DEFAULT_FORUM_CATEGORIES;
        this.cdr.markForCheck();
      },
      error: () => {
        this.categories = DEFAULT_FORUM_CATEGORIES;
        this.cdr.markForCheck();
      }
    });
  }

  loadPost(): void {
    this.loading = true;
    this.error = '';
    this.forumService.getPostById(this.postId!).pipe(
      finalize(() => {
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 0);
      })
    ).subscribe({
      next: (post) => {
        this.currentPost = post;
        this.postForm.patchValue({
          title: post.title,
          content: post.content,
          categoryId: post.categoryId ?? null
        });
      },
      error: () => {
        this.error = 'Failed to load post.';
      }
    });
  }

  onSubmit(): void {
    if (this.postForm.invalid) return;

    this.loading = true;
    this.error = '';
    const raw = this.postForm.value;
    const request = {
      ...raw,
      categoryId: raw.categoryId || undefined
    };

    const clearLoading = () => {
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 0);
    };

    if (this.isEdit) {
      this.forumService.updatePost(this.postId!, request as UpdatePostRequest).subscribe({
        next: () => {
          clearLoading();
          this.router.navigate([this.getForumBasePath(), this.postId]);
        },
        error: (err) => {
          this.error = (err.error && typeof err.error === 'string') ? err.error : 'Failed to update post.';
          clearLoading();
        }
      });
    } else {
      this.forumService.createPost(request as CreatePostRequest).subscribe({
        next: (post) => {
          this.postId = post.id;
          this.currentPost = { ...post, imageUrls: post.imageUrls ?? [], imageIds: post.imageIds ?? [] };
          this.isEdit = true;
          if (this.pendingImageFiles.length > 0) {
            this.loading = false;
            this.uploadingImages = true;
            this.cdr.markForCheck();
            this.forumService.uploadPostImages(post.id, this.pendingImageFiles).subscribe({
              next: () => {
                this.pendingImageFiles = [];
                this.revokePendingPreviews();
                this.uploadingImages = false;
                this.forumService.getPostById(post.id).subscribe({
                  next: (updated) => {
                    this.currentPost = updated;
                    this.createdJustNow = true;
                    this.cdr.markForCheck();
                  }
                });
              },
              error: (err) => {
                this.uploadingImages = false;
                this.imageUploadError = err?.error?.message || err?.error || 'Some images failed to upload.';
                this.createdJustNow = true;
                this.forumService.getPostById(post.id).subscribe({
                  next: (updated) => { this.currentPost = updated; this.cdr.markForCheck(); }
                });
                clearLoading();
              }
            });
          } else {
            this.createdJustNow = true;
            clearLoading();
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.error = (err.error && typeof err.error === 'string') ? err.error : 'Failed to create post.';
          clearLoading();
        }
      });
    }
  }

  /** Show Images section on new post (before publish). */
  isNewPostForm(): boolean {
    return !this.isEdit && !this.currentPost;
  }

  onPendingImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      this.pendingImageFiles.push(files[i]);
      this.pendingPreviewUrls.push(URL.createObjectURL(files[i]));
    }
    input.value = '';
    this.imageUploadError = '';
    this.cdr.markForCheck();
  }

  removePendingImage(index: number): void {
    URL.revokeObjectURL(this.pendingPreviewUrls[index]);
    this.pendingPreviewUrls.splice(index, 1);
    this.pendingImageFiles.splice(index, 1);
    this.cdr.markForCheck();
  }

  private revokePendingPreviews(): void {
    this.pendingPreviewUrls.forEach(u => URL.revokeObjectURL(u));
    this.pendingPreviewUrls = [];
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length || !this.postId) return;
    this.imageUploadError = '';
    this.uploadingImages = true;
    this.cdr.markForCheck();
    this.forumService.uploadPostImages(this.postId, Array.from(files)).subscribe({
      next: () => {
        this.uploadingImages = false;
        input.value = '';
        this.forumService.getPostById(this.postId!).subscribe({
          next: (post) => {
            this.currentPost = post;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.uploadingImages = false;
        this.imageUploadError = err?.error?.message || err?.error || 'Failed to upload. Max 5MB, JPEG/PNG/GIF/WebP only.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteImage(index: number): void {
    if (!this.currentPost?.imageIds?.length || this.currentPost.imageIds.length <= index || !confirm('Remove this image?')) return;
    const imageId = this.currentPost.imageIds[index];
    this.forumService.deletePostImage(this.currentPost.id, imageId).subscribe({
      next: () => {
        this.currentPost!.imageUrls = this.currentPost!.imageUrls?.filter((_, i) => i !== index) ?? [];
        this.currentPost!.imageIds = this.currentPost!.imageIds?.filter((_, i) => i !== index) ?? [];
        this.cdr.markForCheck();
      },
      error: () => alert('Failed to remove image.')
    });
  }

  viewPost(): void {
    this.router.navigate([this.getForumBasePath(), this.postId]);
  }

  cancel(): void {
    this.router.navigate([this.getForumBasePath()]);
  }

  private getForumBasePath(): string {
    const role = this.authService.currentUser?.role;

    if (role === 'ADMIN') {
      return '/admin/forum';
    }
    if (role === 'PATIENT') {
      return '/patient/forum';
    }
    if (role === 'CAREGIVER') {
      return '/caregiver/forum';
    }
    if (role === 'PROVIDER') {
      return '/provider/forum';
    }

    return '/homePage';
  }
}