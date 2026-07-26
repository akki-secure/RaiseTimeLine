package com.raisetimeline.controller;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.security.CurrentUser;
import com.raisetimeline.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<FollowResponse> toggle(@PathVariable String username) {
        return ResponseEntity.ok(followService.toggle(CurrentUser.id(), username));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserSummaryResponse>> getFollowing(@PathVariable String username) {
        return ResponseEntity.ok(followService.listFollowing(CurrentUser.id(), username));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserSummaryResponse>> getFollowers(@PathVariable String username) {
        return ResponseEntity.ok(followService.listFollowers(CurrentUser.id(), username));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<UserSummaryResponse>> getSuggestions(@RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(followService.suggestions(CurrentUser.id(), limit));
    }
}
