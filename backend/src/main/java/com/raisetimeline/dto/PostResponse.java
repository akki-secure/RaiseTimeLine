package com.raisetimeline.dto;

import com.raisetimeline.model.PostWithAuthor;

import java.time.LocalDateTime;

public class PostResponse {
    private final Long id;
    private final Long userId;
    private final String username;
    private final String displayName;
    private final String body;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final boolean edited;
    private final boolean mine;

    public PostResponse(PostWithAuthor post, boolean mine) {
        this.id = post.getId();
        this.userId = post.getUserId();
        this.username = post.getAuthorUsername();
        this.displayName = post.getAuthorDisplayName();
        this.body = post.getBody();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
        this.edited = !post.getUpdatedAt().equals(post.getCreatedAt());
        this.mine = mine;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getBody() { return body; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isEdited() { return edited; }
    public boolean isMine() { return mine; }
}
