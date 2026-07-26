package com.raisetimeline.dto;

import com.raisetimeline.model.CommentWithAuthor;

import java.time.LocalDateTime;

public class CommentResponse {
    private final Long id;
    private final Long postId;
    private final Long userId;
    private final String username;
    private final String displayName;
    private final String body;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final boolean edited;
    private final boolean mine;

    public CommentResponse(CommentWithAuthor comment, boolean mine) {
        this.id = comment.getId();
        this.postId = comment.getPostId();
        this.userId = comment.getUserId();
        this.username = comment.getAuthorUsername();
        this.displayName = comment.getAuthorDisplayName();
        this.body = comment.getBody();
        this.createdAt = comment.getCreatedAt();
        this.updatedAt = comment.getUpdatedAt();
        this.edited = !comment.getUpdatedAt().equals(comment.getCreatedAt());
        this.mine = mine;
    }

    public Long getId() { return id; }
    public Long getPostId() { return postId; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getBody() { return body; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isEdited() { return edited; }
    public boolean isMine() { return mine; }
}
