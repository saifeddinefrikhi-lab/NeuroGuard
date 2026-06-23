import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../../core/services/forum.service';
import { AuthService } from '../../core/services/auth.service';
import { UserManagementService } from '../../core/services/user-management.service';
import { PostDto } from '../../core/models/post.dto';
import { CommentDto, CreateCommentRequest, CreateReplyRequest } from '../../core/models/comment.dto';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { observeOn, of, Observable, forkJoin, map, catchError } from 'rxjs';
import { asyncScheduler } from 'rxjs';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostDetailComponent implements OnInit {
  post?: PostDto;
  comments: CommentDto[] = [];
  topLevelComments: CommentDto[] = [];
  commentForm: FormGroup;
  replyForm: FormGroup;
  editCommentForm: FormGroup;
  replyingTo: number | null = null;
  editingCommentId: number | null = null;
  loading = false;
  postLoading = false;
  error = '';
  notFound = false;
  uploadingImages = false;
  imageUploadError = '';
  private userCache: Map<number, string> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public forumService: ForumService,
    public authService: AuthService,
    private fb: FormBuilder,
    private userService: UserManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });
    this.replyForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });
    this.editCommentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.error = 'Invalid post.';
      this.cdr.markForCheck();
      return;
    }
    const id = +idParam;
    if (isNaN(id) || id < 1) {
      this.error = 'Invalid post.';
      this.cdr.markForCheck();
      return;
    }
    this.loadPost(id);
    this.loadComments(id);
  }

  loadPost(id: number): void {
    this.postLoading = true;
    this.error = '';
    this.notFound = false;
    this.cdr.markForCheck();
    this.forumService.getPostById(id).pipe(observeOn(asyncScheduler)).subscribe({
      next: (data) => {
        this.post = data;
        this.postLoading = false;
        this.cdr.markForCheck();
        if (!data.authorUsername || data.authorUsername.trim() === '' || data.authorUsername === 'Unknown') {
          this.resolveUsername(data.authorId).subscribe({
            next: username => {
              if (this.post) {
                this.post.authorUsername = username;
                this.cdr.markForCheck();
              }
            },
            error: () => {
              if (this.post) {
                this.post.authorUsername = 'Unknown User';
                this.cdr.markForCheck();
              }
            }
          });
        }
      },
      error: (err: { status?: number }) => {
        this.postLoading = false;
        this.notFound = err?.status === 404;
        this.error = this.notFound ? 'Post not found.' : 'Failed to load post.';
        this.cdr.markForCheck();
      }
    });
  }

  loadComments(postId: number): void {
    this.forumService.getCommentsByPost(postId).pipe(observeOn(asyncScheduler)).subscribe({
      next: (data) => {
        this.comments = data;
        this.resolveCommentUsernames();
        this.processComments();
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
  }

  private resolveCommentUsernames(): void {
    const need = this.comments.filter(c => !c.authorUsername || c.authorUsername.trim() === '' || c.authorUsername === 'Unknown');
    if (need.length === 0) return;
    forkJoin(need.map(c => this.resolveUsername(c.authorId).pipe(
      map(username => ({ comment: c, username })),
      catchError(() => of({ comment: c, username: 'Unknown User' }))
    ))).subscribe({
      next: results => {
        results.forEach(({ comment, username }) => {
          const x = this.comments.find(c => c.id === comment.id);
          if (x) x.authorUsername = username;
        });
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
  }

  private resolveUsername(userId: number): Observable<string> {
    if (this.userCache.has(userId)) return of(this.userCache.get(userId)!);
    return new Observable(observer => {
      this.userService.getUserById(userId).subscribe({
        next: user => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User';
          this.userCache.set(userId, name);
          observer.next(name);
          observer.complete();
        },
        error: e => observer.error(e)
      });
    });
  }

  likePost(): void {
    if (!this.post) return;
    if (!this.authService.isLoggedIn) { this.router.navigate(['/login']); return; }
    if (this.post.likedByCurrentUser) {
      this.forumService.unlikePost(this.post.id).subscribe({
        next: () => { if (this.post) { this.post.likedByCurrentUser = false; this.post.likeCount--; this.cdr.markForCheck(); } },
        error: () => alert('Failed to unlike post.')
      });
    } else {
      this.forumService.likePost(this.post.id).subscribe({
        next: () => { if (this.post) { this.post.likedByCurrentUser = true; this.post.likeCount++; this.cdr.markForCheck(); } },
        error: () => alert('Failed to like post.')
      });
    }
  }

  sharePost(): void {
    if (!this.post || !this.authService.isLoggedIn) return;
    if (this.post.sharedByCurrentUser) { alert('You already shared this post.'); return; }
    this.forumService.sharePost(this.post.id).subscribe({
      next: () => { if (this.post) { this.post.sharedByCurrentUser = true; this.post.shareCount++; this.cdr.markForCheck(); } },
      error: () => alert('Failed to share post.')
    });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.post) return;
    this.loading = true;
    this.forumService.addComment(this.post.id, { content: this.commentForm.value.content }).subscribe({
      next: comment => {
        this.comments.push(comment);
        this.processComments();
        this.commentForm.reset();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        alert((err?.error && typeof err.error === 'string') ? err.error : 'Failed to add comment.');
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!this.post || !confirm('Delete this comment?')) return;
    this.forumService.deleteComment(this.post.id, commentId).subscribe({
      next: () => { this.comments = this.comments.filter(c => c.id !== commentId); this.cdr.markForCheck(); },
      error: () => alert('Failed to delete comment.')
    });
  }

  likeComment(comment: CommentDto): void {
    if (!this.post) return;
    if (!this.authService.isLoggedIn) { this.router.navigate(['/login']); return; }
    if (comment.likedByCurrentUser) {
      this.forumService.unlikeComment(this.post.id, comment.id).subscribe({
        next: () => { comment.likedByCurrentUser = false; comment.likeCount--; this.cdr.markForCheck(); },
        error: () => alert('Failed to unlike comment.')
      });
    } else {
      this.forumService.likeComment(this.post.id, comment.id).subscribe({
        next: () => { comment.likedByCurrentUser = true; comment.likeCount++; this.cdr.markForCheck(); },
        error: () => alert('Failed to like comment.')
      });
    }
  }

  setReplyingTo(commentId: number | null): void {
    this.replyingTo = commentId;
    if (commentId) this.replyForm.reset();
    this.editingCommentId = null;
    this.cdr.markForCheck();
  }

  submitReply(): void {
    if (this.replyForm.invalid || !this.post || !this.replyingTo) return;
    this.forumService.replyToComment(this.post.id, this.replyingTo, { content: this.replyForm.value.content }).subscribe({
      next: reply => {
        this.comments.push(reply);
        this.processComments();
        this.replyingTo = null;
        this.replyForm.reset();
        this.cdr.markForCheck();
      },
      error: (err) => alert((err?.error && typeof err.error === 'string') ? err.error : 'Failed to post reply.')
    });
  }

  isAdmin(): boolean {
    return this.authService.currentUser?.role === 'ADMIN';
  }

  canEditPost(): boolean {
    const u = this.authService.currentUser;
    return !!u && (u.role === 'ADMIN' || u.userId === this.post?.authorId);
  }

  togglePin(): void {
    if (!this.post || !this.isAdmin()) return;
    const newPinned = !this.post.pinned;
    this.forumService.setPinned(this.post.id, newPinned).subscribe({
      next: (updated) => {
        this.post = { ...this.post!, pinned: updated.pinned };
        this.cdr.markForCheck();
      },
      error: () => alert('Failed to update pin.')
    });
  }

  editPost(): void {
    if (this.post) this.router.navigate([this.getForumBasePath(), 'edit', this.post.id]);
  }

  deletePost(): void {
    if (!this.post || !confirm('Delete this post?')) return;
    this.forumService.deletePost(this.post.id).subscribe({
      next: () => this.router.navigate([this.getForumBasePath()]),
      error: () => alert('Failed to delete post.')
    });
  }

  canDeleteComment(comment: CommentDto): boolean {
    const u = this.authService.currentUser;
    return !!u && (u.role === 'ADMIN' || u.userId === comment.authorId);
  }

  canEditComment(comment: CommentDto): boolean {
    return this.canDeleteComment(comment);
  }

  startEditComment(comment: CommentDto): void {
    this.editingCommentId = comment.id;
    this.editCommentForm.patchValue({ content: comment.content });
    this.replyingTo = null;
    this.cdr.markForCheck();
  }

  saveEditComment(): void {
    if (this.editCommentForm.invalid || !this.post || this.editingCommentId == null) return;
    this.loading = true;
    this.forumService.updateComment(this.post.id, this.editingCommentId, { content: this.editCommentForm.value.content }).subscribe({
      next: updated => {
        const i = this.comments.findIndex(c => c.id === updated.id);
        if (i !== -1) this.comments[i] = updated;
        this.processComments();
        this.editingCommentId = null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        alert((err?.error && typeof err.error === 'string') ? err.error : 'Failed to update comment.');
      }
    });
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.cdr.markForCheck();
  }

  backToForum(): void {
    this.router.navigate([this.getForumBasePath()]);
  }

  private getForumBasePath(): string {
    const r = this.authService.currentUser?.role;
    if (r === 'ADMIN') return '/admin/forum';
    if (r === 'PATIENT') return '/patient/forum';
    if (r === 'CAREGIVER') return '/caregiver/forum';
    if (r === 'PROVIDER') return '/provider/forum';
    return '/homePage';
  }

  getReplies(comment: CommentDto): CommentDto[] {
    return comment.replies || [];
  }

  getCurrentUserName(): string {
    return this.authService.currentUser?.name || 'User';
  }

  getCurrentUserInitial(): string {
    return this.getCurrentUserName().charAt(0).toUpperCase();
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length || !this.post) return;
    this.imageUploadError = '';
    this.uploadingImages = true;
    this.cdr.markForCheck();
    this.forumService.uploadPostImages(this.post.id, Array.from(files)).subscribe({
      next: () => {
        this.uploadingImages = false;
        input.value = '';
        this.loadPost(this.post!.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.uploadingImages = false;
        this.imageUploadError = err?.error?.message || err?.error || 'Failed to upload images. Max 5MB per file, JPEG/PNG/GIF/WebP only.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteImage(index: number): void {
    if (!this.post?.imageIds?.length || this.post.imageIds.length <= index || !confirm('Remove this image?')) return;
    const imageId = this.post.imageIds[index];
    this.forumService.deletePostImage(this.post.id, imageId).subscribe({
      next: () => {
        this.post!.imageUrls = this.post!.imageUrls?.filter((_, i) => i !== index) ?? [];
        this.post!.imageIds = this.post!.imageIds?.filter((_, i) => i !== index) ?? [];
        this.cdr.markForCheck();
      },
      error: () => alert('Failed to remove image.')
    });
  }

  processComments(): void {
    const map = new Map<number, CommentDto>();
    this.comments.forEach(c => map.set(c.id, c));
    this.comments.forEach(c => (c.replies = []));
    this.topLevelComments = [];
    this.comments.forEach(c => {
      if (c.parentCommentId) {
        const p = map.get(c.parentCommentId);
        if (p) (p.replies = p.replies || []).push(c);
      } else {
        this.topLevelComments.push(c);
      }
    });
  }
}
