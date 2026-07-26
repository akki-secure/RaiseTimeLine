package com.raisetimeline.controller;

import com.raisetimeline.dto.PostRequest;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.security.CurrentUser;
import com.raisetimeline.service.PostService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> list(
            @RequestParam(required = false) Long beforeId,
            @RequestParam(required = false) Long afterId,
            @RequestParam(required = false) Integer limit) {
        if (afterId != null) {
            return ResponseEntity.ok(postService.listNewerThan(CurrentUser.id(), afterId));
        }
        return ResponseEntity.ok(postService.listPage(CurrentUser.id(), beforeId, limit));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> create(
            @RequestParam("body") String body,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(postService.create(CurrentUser.id(), body, image));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> update(@PathVariable Long id, @RequestBody PostRequest req) {
        return ResponseEntity.ok(postService.update(CurrentUser.id(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        postService.delete(CurrentUser.id(), id);
        return ResponseEntity.noContent().build();
    }
}
