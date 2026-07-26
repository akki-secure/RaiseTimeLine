package com.raisetimeline.controller;

import com.raisetimeline.dto.CommentRequest;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.security.CurrentUser;
import com.raisetimeline.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> list(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.listByPost(CurrentUser.id(), postId));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> create(@PathVariable Long postId, @RequestBody CommentRequest req) {
        return ResponseEntity.ok(commentService.create(CurrentUser.id(), postId, req));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> update(@PathVariable Long postId, @PathVariable Long commentId,
                                                   @RequestBody CommentRequest req) {
        return ResponseEntity.ok(commentService.update(CurrentUser.id(), postId, commentId, req));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long postId, @PathVariable Long commentId) {
        commentService.delete(CurrentUser.id(), postId, commentId);
        return ResponseEntity.noContent().build();
    }
}
