package com.neuroguard.forumsservice.controller;

import com.neuroguard.forumsservice.dto.PagedResponse;
import com.neuroguard.forumsservice.dto.PostRequest;
import com.neuroguard.forumsservice.dto.PostResponse;
import com.neuroguard.forumsservice.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    private Long getCurrentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }

    private String getCurrentUserRole(HttpServletRequest request) {
        return (String) request.getAttribute("userRole");
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts(HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        return ResponseEntity.ok(postService.getAllPosts(currentUserId));
    }

    @GetMapping("/paged")
    public ResponseEntity<PagedResponse<PostResponse>> getPostsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort,
            HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        return ResponseEntity.ok(postService.getPostsPaged(page, size, sort, currentUserId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        return ResponseEntity.ok(postService.getPostById(id, currentUserId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody PostRequest request,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId(httpRequest);
        PostResponse created = postService.createPost(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostRequest request,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId(httpRequest);
        String role = getCurrentUserRole(httpRequest);
        return ResponseEntity.ok(postService.updatePost(id, request, userId, role));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId(httpRequest);
        String role = getCurrentUserRole(httpRequest);
        postService.deletePost(id, userId, role);
        return ResponseEntity.noContent().build();
    }

    // New endpoints for likes and shares
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> likePost(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        postService.likePost(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unlikePost(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        postService.unlikePost(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> sharePost(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        postService.sharePost(id, userId);
        return ResponseEntity.ok().build();
    }
}