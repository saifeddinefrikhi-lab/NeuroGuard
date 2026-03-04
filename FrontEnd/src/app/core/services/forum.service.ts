import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PostDto, CreatePostRequest, UpdatePostRequest, PagedResponse } from '../models/post.dto';
import { CommentDto, CreateCommentRequest, CreateReplyRequest } from '../models/comment.dto';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private baseUrl = `${environment.apiUrl}/api/posts`;

  constructor(private http: HttpClient) {}

  // ---------- Posts ----------
  getAllPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(this.baseUrl);
  }

  getPostsPaged(page = 0, size = 10, sort = 'newest'): Observable<PagedResponse<PostDto>> {
    const params = { page: String(page), size: String(size), sort };
    return this.http.get<PagedResponse<PostDto>>(`${this.baseUrl}/paged`, { params });
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