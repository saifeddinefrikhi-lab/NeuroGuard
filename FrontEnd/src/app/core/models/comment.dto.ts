export interface CommentDto {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  authorUsername: string;
  createdAt: string;
  updatedAt?: string | null;         // set when edited
  parentCommentId?: number | null;
  likeCount: number;
  replyCount: number;
  likedByCurrentUser?: boolean;
  /** Filled client-side when building comment tree */
  replies?: CommentDto[];
  authorRole?: string;  // e.g. PATIENT, PROVIDER, ADMIN
}

export interface CreateCommentRequest {
  content: string;
}

// New: Reply request (same as comment request)
export interface CreateReplyRequest {
  content: string;
}