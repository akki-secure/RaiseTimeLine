package com.raisetimeline.dto;

import com.raisetimeline.model.User;

public class UserProfileResponse {
    private final Long id;
    private final String username;
    private final String displayName;
    private final String bio;
    private final String avatarUrl;
    private final boolean followedByMe;
    private final int followingCount;
    private final int followerCount;

    public UserProfileResponse(User user, boolean followedByMe, int followingCount, int followerCount) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.displayName = user.getDisplayName();
        this.bio = user.getBio();
        this.avatarUrl = user.getAvatarUrl();
        this.followedByMe = followedByMe;
        this.followingCount = followingCount;
        this.followerCount = followerCount;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getBio() { return bio; }
    public String getAvatarUrl() { return avatarUrl; }
    public boolean isFollowedByMe() { return followedByMe; }
    public int getFollowingCount() { return followingCount; }
    public int getFollowerCount() { return followerCount; }
}
