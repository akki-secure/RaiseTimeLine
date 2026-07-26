package com.raisetimeline.controller;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.dto.UpdateBioRequest;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.security.CurrentUser;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PostService postService;

    public UserController(UserService userService, PostService postService) {
        this.userService = userService;
        this.postService = postService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSummaryResponse>> search(@RequestParam("q") String q) {
        return ResponseEntity.ok(userService.search(CurrentUser.id(), q));
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserSummaryResponse> getProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getProfile(username));
    }

    @GetMapping("/{username}/posts")
    public ResponseEntity<List<PostResponse>> getPosts(
            @PathVariable String username,
            @RequestParam(required = false) Long beforeId,
            @RequestParam(required = false) Integer limit) {
        UserSummaryResponse profile = userService.getProfile(username);
        return ResponseEntity.ok(postService.listPageByUserId(CurrentUser.id(), profile.getId(), beforeId, limit));
    }

    @PutMapping("/me")
    public ResponseEntity<UserSummaryResponse> updateMyBio(@RequestBody UpdateBioRequest req) {
        return ResponseEntity.ok(userService.updateBio(CurrentUser.id(), req.getBio()));
    }
}
