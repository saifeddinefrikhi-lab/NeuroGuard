import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PostDto, CreatePostRequest, UpdatePostRequest, PagedResponse, CategoryDto } from '../models/post.dto';
import { CommentDto, CreateCommentRequest, CreateReplyRequest } from '../models/comment.dto';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private baseUrl = `${environment.apiUrl}/api/posts`;
  private categoriesUrl = `${environment.apiUrl}/api/categories`;

  constructor(private http: HttpClient) {}

  // ---------- Posts ----------
  getAllPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(this.baseUrl);
  }

  getPostsPaged(page = 0, size = 10, sort = 'newest', categoryId?: number): Observable<PagedResponse<PostDto>> {
    const params: Record<string, string> = { page: String(page), size: String(size), sort };
    if (categoryId != null) params['categoryId'] = String(categoryId);
    return this.http.get<PagedResponse<PostDto>>(`${this.baseUrl}/paged`, { params });
  }

  searchPosts(q: string, page = 0, size = 10): Observable<PagedResponse<PostDto>> {
    const params = { q: q || '', page: String(page), size: String(size) };
    return this.http.get<PagedResponse<PostDto>>(`${this.baseUrl}/search`, { params });
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.categoriesUrl);
  }

  getPostById(id: number): Observable<PostDto> {
    return this.http.get<PostDto>(`${this.baseUrl}/${id}`);
  }

  createPost(request: CreatePostRequest): Observable<PostDto> {
    return this.http.post<PostDto>(this.baseUrl, request);
  }

  updatePost(id: number, request: UpdatePostRequest): Observable<PostDto> {
    return this.http.put<PostDto>(`${this.baseUrl}/${id}`, request);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // New: Like/unlike post
  likePost(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/like`, {});
  }

  unlikePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/like`);
  }

  // New: Share post
  sharePost(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/share`, {});
  }

  setPinned(id: number, pinned: boolean): Observable<PostDto> {
    return this.http.put<PostDto>(`${this.baseUrl}/${id}/pin`, null, { params: { pinned: String(pinned) } });
  }

  // Post images
  uploadPostImages(postId: number, files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post<string[]>(`${this.baseUrl}/${postId}/images`, formData);
  }

  deletePostImage(postId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${postId}/images/${imageId}`);
  }

  /** Full URL for an image (API returns relative path). */
  getPostImageUrl(relativeUrl: string): string {
    if (!relativeUrl) return '';
    const base = environment.apiUrl;
    return relativeUrl.startsWith('/') ? `${base}${relativeUrl}` : `${base}/${relativeUrl}`;
  }

  // ---------- Comments ----------
  getCommentsByPost(postId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.baseUrl}/${postId}/comments`);
  }

  addComment(postId: number, request: CreateCommentRequest): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.baseUrl}/${postId}/comments`, request);
  }

  updateComment(postId: number, commentId: number, request: CreateCommentRequest): Observable<CommentDto> {
    return this.http.put<CommentDto>(`${this.baseUrl}/${postId}/comments/${commentId}`, request);
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${postId}/comments/${commentId}`);
  }

  // Like/unlike comment
  likeComment(postId: number, commentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${postId}/comments/${commentId}/like`, {});
  }

  unlikeComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${postId}/comments/${commentId}/like`);
  }

  // New: Reply to comment
  replyToComment(postId: number, commentId: number, request: CreateReplyRequest): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.baseUrl}/${postId}/comments/${commentId}/replies`, request);
  }
}