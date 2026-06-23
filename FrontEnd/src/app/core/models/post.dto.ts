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
  pinned?: boolean;
  categoryId?: number;
  categoryName?: string;
  authorRole?: string;  // e.g. PATIENT, PROVIDER, ADMIN
  readabilityScore?: number;   // Flesch Reading Ease 0–100
  readabilityLabel?: string;   // Easy, Medium, Hard
  imageUrls?: string[];       // URLs to view post images
  imageIds?: number[];        // same order as imageUrls, for delete
}

export interface CategoryDto {
  id: number;
  name: string;
}

/** Default forum categories (fallback when API returns none). Match backend CategorySeeder. */
export const DEFAULT_FORUM_CATEGORIES: CategoryDto[] = [
  { id: 1, name: 'General' },
  { id: 2, name: 'Medication' },
  { id: 3, name: 'Caregiving' },
  { id: 4, name: 'Symptoms' },
  { id: 5, name: 'Support' },
  { id: 6, name: 'Resources' }
];

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId?: number;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  categoryId?: number;
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