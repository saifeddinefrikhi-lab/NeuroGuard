package com.neuroguard.forumsservice.repository;


import com.neuroguard.forumsservice.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByAuthorId(Long authorId);

    List<Post> findAllByOrderByCreatedAtDesc();

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Post p ORDER BY size(p.likes) DESC, p.createdAt DESC")
    Page<Post> findPostsOrderByLikesDesc(Pageable pageable);

    @Query("SELECT p FROM Post p ORDER BY (SELECT COUNT(c) FROM Comment c WHERE c.post = p) DESC, p.createdAt DESC")
    Page<Post> findPostsOrderByCommentCountDesc(Pageable pageable);
}