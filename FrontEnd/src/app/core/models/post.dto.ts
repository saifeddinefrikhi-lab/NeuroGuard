export interface PostDto {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorUsername: string;
  createdAt: string;      // ISO date string
  updatedAt: string;
  commentCount: number;
  likeCount: number;       // new
  shareCount: number;      // new
  likedByCurrentUser?: boolean; // optional, present if user authenticated
  sharedByCurrentUser?: boolean; // optional
}

export interface CreatePostRequest {
  title: string;
  content: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;  // current page (0-based)
  first: boolean;
  last: boolean;
}