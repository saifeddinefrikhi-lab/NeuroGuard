// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ForumService } from '../../app/core/services/forum.service';
import { environment } from '../../environments/environment';
import { PostResponse, CommentResponse } from '../../../app/core/models/forum.model';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;

  const mockPost: PostResponse = {
    id: 1,
    title: 'Test Post',
    content: 'This is a test post',
    authorId: 1,
    authorName: 'John Doe',
    category: 'GENERAL',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    likeCount: 5,
    commentCount: 3,
    isLiked: false
  };

  const mockComment: CommentResponse = {
    id: 1,
    postId: 1,
    content: 'Great post!',
    authorId: 1,
    authorName: 'Jane Doe',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    likeCount: 2
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ForumService]
    });

    service = TestBed.inject(ForumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Post CRUD Operations', () => {
    xit('should get all posts', () => {
      service.getAllPosts().subscribe((posts) => {
        expect(posts.length).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts`);
      expect(req.request.method).toBe('GET');
      req.flush([mockPost]);
    });

    it('should get post by ID', () => {
      service.getPostById(1).subscribe((post) => {
        expect(post.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPost);
    });

    it('should create post', () => {
      const newPost = { title: 'New Post', content: 'Content', category: 'GENERAL' };

      service.createPost(newPost).subscribe((post) => {
        expect(post.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts`);
      expect(req.request.method).toBe('POST');
      req.flush(mockPost);
    });

    it('should update post', () => {
      const update = { title: 'Updated Title', content: 'Updated content' };

      service.updatePost(1, update).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockPost);
    });

    it('should delete post', () => {
      service.deletePost(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Post Pagination', () => {
    xit('should get posts with pagination', () => {
      service.getPostsPaginated(0, 10).subscribe((result) => {
        expect(result.posts).toBeTruthy();
      });

      const req = httpMock.expectOne((r) => r.url.includes('page=0') && r.url.includes('pageSize=10'));
      expect(req.request.method).toBe('GET');
      req.flush({ posts: [mockPost], totalPages: 5 });
    });

    xit('should get different page', () => {
      service.getPostsPaginated(2, 10).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('page=2'));
      req.flush({ posts: [mockPost], totalPages: 5 });
    });
  });

  describe('Post Search', () => {
    xit('should search posts by keyword', () => {
      service.searchPosts('test').subscribe((posts) => {
        expect(Array.isArray(posts)).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url.includes('keyword=test'));
      expect(req.request.method).toBe('GET');
      req.flush([mockPost]);
    });

    xit('should search posts by category', () => {
      service.searchByCategory('GENERAL').subscribe((posts) => {
        expect(posts.length).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne((r) => r.url.includes('category=GENERAL'));
      req.flush([mockPost]);
    });
  });

  describe('Comments', () => {
    xit('should get comments for post', () => {
      service.getComments(1).subscribe((comments) => {
        expect(Array.isArray(comments)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/comments`);
      expect(req.request.method).toBe('GET');
      req.flush([mockComment]);
    });

    it('should add comment to post', () => {
      const newComment = { content: 'Great post!' };

      service.addComment(1, newComment).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/comments`);
      expect(req.request.method).toBe('POST');
      req.flush(mockComment);
    });

    it('should delete comment', () => {
      service.deleteComment(1, 1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/comments/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should reply to comment', () => {
      const reply = { content: 'Thanks for the feedback' };

      service.replyToComment(1, 1, reply).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/comments/1/replies`);
      expect(req.request.method).toBe('POST');
      req.flush(mockComment);
    });
  });

  describe('Images', () => {
    xit('should upload image', () => {
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

      service.uploadImage(file).subscribe((response) => {
        expect(response.imageUrl).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/forum/images`);
      expect(req.request.method).toBe('POST');
      req.flush({ imageUrl: 'http://example.com/image.jpg' });
    });
  });

  describe('Likes', () => {
    it('should like post', () => {
      service.likePost(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/like`);
      expect(req.request.method).toBe('POST');
      req.flush({ liked: true });
    });

    xit('should unlike post', () => {
      service.unlikePost(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/like`);
      expect(req.request.method).toBe('POST');
      req.flush({ liked: false });
    });

    xit('should toggle like status', () => {
      let likeCount = 5;

      service.likePost(1).subscribe((result) => {
        expect(result.liked).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/like`);
      req.flush({ liked: true, likeCount: likeCount + 1 });
    });
  });

  describe('Categories', () => {
    it('should get all categories', () => {
      service.getCategories().subscribe((categories) => {
        expect(Array.isArray(categories)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(['GENERAL', 'MEDICAL', 'SUPPORT']);
    });

    xit('should filter posts by category', () => {
      service.getPostsByCategory('MEDICAL').subscribe((posts) => {
        expect(posts.length).toBeGreaterThanOrEqual(0);
      });

      const req = httpMock.expectOne((r) => r.url.includes('category=MEDICAL'));
      req.flush([mockPost]);
    });
  });

  describe('Error Handling', () => {
    xit('should handle 401 unauthorized', () => {
      service.createPost({ title: 'New', content: 'Test', category: 'GENERAL' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    xit('should handle 404 not found', () => {
      service.getPostById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/999`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    xit('should handle 500 server error', () => {
      service.getAllPosts().subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.status).toBe(500)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Post Properties', () => {
    xit('should preserve post metadata', () => {
      service.getPostById(1).subscribe((post) => {
        expect(post.authorId).toBeDefined();
        expect(post.authorName).toBeDefined();
        expect(post.createdAt).toBeDefined();
        expect(post.likeCount).toBeDefined();
        expect(post.commentCount).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1`);
      req.flush(mockPost);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle concurrent operations', () => {
      service.getAllPosts().subscribe();
      service.getCategories().subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/posts`);
      req1.flush([mockPost]);

      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req2.flush(['GENERAL', 'MEDICAL']);
    });
  });
});
