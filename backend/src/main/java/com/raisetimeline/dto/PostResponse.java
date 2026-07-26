package com.raisetimeline.dto;

import com.raisetimeline.model.PostWithAuthor;

import java.time.LocalDateTime;

public class PostResponse {
    private final Long id;
    private final Long userId;
    private final String username;
    private final String displayName;
    private final String body;
    private final String imageUrl;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final boolean edited;
    private final boolean mine;
    private final int likeCount;
    private final boolean likedByMe;

    public PostResponse(PostWithAuthor post, boolean mine) {
        this.id = post.getId();
        this.userId = post.getUserId();
        this.username = post.getAuthorUsername();
        this.displayName = post.getAuthorDisplayName();
        this.body = post.getBody();
        this.imageUrl = post.getImageUrl();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
        this.edited = !post.getUpdatedAt().equals(post.getCreatedAt());
        this.mine = mine;
        this.likeCount = post.getLikeCount();
        this.likedByMe = post.isLikedByMe();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getBody() { return body; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isEdited() { return edited; }
    public boolean isMine() { return mine; }
    public int getLikeCount() { return likeCount; }
    public boolean isLikedByMe() { return likedByMe; }
}
