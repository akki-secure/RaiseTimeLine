package com.raisetimeline.dto;

public class LikeResponse {
    private final boolean liked;
    private final int likeCount;

    public LikeResponse(boolean liked, int likeCount) {
        this.liked = liked;
        this.likeCount = likeCount;
    }

    public boolean isLiked() { return liked; }
    public int getLikeCount() { return likeCount; }
}
