package com.raisetimeline.dto;

import com.raisetimeline.model.User;

public class UserSummaryResponse {
    private final Long id;
    private final String username;
    private final String displayName;
    private final String bio;
    private final String avatarUrl;

    public UserSummaryResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.displayName = user.getDisplayName();
        this.bio = user.getBio();
        this.avatarUrl = user.getAvatarUrl();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getBio() { return bio; }
    public String getAvatarUrl() { return avatarUrl; }
}
