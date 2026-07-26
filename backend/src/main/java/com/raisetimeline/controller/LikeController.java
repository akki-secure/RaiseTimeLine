package com.raisetimeline.controller;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.security.CurrentUser;
import com.raisetimeline.service.LikeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping
    public ResponseEntity<LikeResponse> toggle(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.toggle(CurrentUser.id(), postId));
    }
}
