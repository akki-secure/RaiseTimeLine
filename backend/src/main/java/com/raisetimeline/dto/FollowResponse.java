package com.raisetimeline.dto;

public class FollowResponse {
    private final boolean followed;
    private final int followerCount;

    public FollowResponse(boolean followed, int followerCount) {
        this.followed = followed;
        this.followerCount = followerCount;
    }

    public boolean isFollowed() { return followed; }
    public int getFollowerCount() { return followerCount; }
}
