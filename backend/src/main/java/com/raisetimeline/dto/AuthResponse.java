package com.raisetimeline.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String username;
    private String displayName;
    private String email;

    public AuthResponse(String token, String refreshToken, Long userId, String username, String displayName, String email) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.email = email;
    }

    public String getToken() { return token; }
    public String getRefreshToken() { return refreshToken; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getEmail() { return email; }
}
