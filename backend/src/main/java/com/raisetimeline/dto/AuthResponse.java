package com.raisetimeline.dto;

public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String displayName;
    private String email;

    public AuthResponse(String token, Long userId, String username, String displayName, String email) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.email = email;
    }

    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getEmail() { return email; }
}
