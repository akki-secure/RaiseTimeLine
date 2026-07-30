package com.raisetimeline.service;

import com.raisetimeline.dto.AuthResponse;
import com.raisetimeline.dto.LoginRequest;
import com.raisetimeline.dto.RefreshTokenRequest;
import com.raisetimeline.dto.RegisterRequest;
import com.raisetimeline.mapper.RefreshTokenMapper;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.model.RefreshToken;
import com.raisetimeline.model.User;
import com.raisetimeline.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserMapper userMapper;
    private RefreshTokenMapper refreshTokenMapper;
    private BCryptPasswordEncoder encoder;
    private JwtUtil jwtUtil;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userMapper = Mockito.mock(UserMapper.class);
        refreshTokenMapper = Mockito.mock(RefreshTokenMapper.class);
        encoder = Mockito.mock(BCryptPasswordEncoder.class);
        jwtUtil = Mockito.mock(JwtUtil.class);
        authService = new AuthService(userMapper, refreshTokenMapper, encoder, jwtUtil);

        when(jwtUtil.generateToken(anyLong(), anyString())).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken()).thenReturn("raw-refresh-token");
        when(jwtUtil.hashToken(anyString())).thenReturn("hashed-token");
        when(jwtUtil.getRefreshExpirationMs()).thenReturn(604_800_000L);
    }

    private User user(Long id, String email, String username) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setUsername(username);
        u.setDisplayName("表示名");
        u.setPasswordHash("hashed-password");
        return u;
    }

    private RegisterRequest registerRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("taro@example.com");
        req.setPassword("password123");
        req.setUsername("taro");
        req.setDisplayName("太郎");
        return req;
    }

    @Test
    void register_不正なメール形式は例外() {
        RegisterRequest req = registerRequest();
        req.setEmail("invalid-email");

        assertThrows(RuntimeException.class, () -> authService.register(req));
    }

    @Test
    void register_短いパスワードは例外() {
        RegisterRequest req = registerRequest();
        req.setPassword("short");

        assertThrows(RuntimeException.class, () -> authService.register(req));
    }

    @Test
    void register_メール重複は例外() {
        RegisterRequest req = registerRequest();
        when(userMapper.existsByEmail("taro@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authService.register(req));
    }

    @Test
    void register_ユーザー名重複は例外() {
        RegisterRequest req = registerRequest();
        when(userMapper.existsByEmail(anyString())).thenReturn(false);
        when(userMapper.existsByUsername("taro")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authService.register(req));
    }

    @Test
    void register_成功時はトークンを発行する() {
        RegisterRequest req = registerRequest();
        when(userMapper.existsByEmail(anyString())).thenReturn(false);
        when(userMapper.existsByUsername(anyString())).thenReturn(false);
        when(encoder.encode("password123")).thenReturn("hashed-password");
        Mockito.doAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return null;
        }).when(userMapper).insert(any(User.class));

        AuthResponse res = authService.register(req);

        assertEquals("access-token", res.getToken());
        assertEquals("raw-refresh-token", res.getRefreshToken());
        Mockito.verify(userMapper).insert(any(User.class));
        Mockito.verify(refreshTokenMapper).insert(any(RefreshToken.class));
    }

    @Test
    void login_存在しないメールは例外() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@example.com");
        req.setPassword("password123");
        when(userMapper.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.login(req));
    }

    @Test
    void login_パスワード不一致は例外() {
        LoginRequest req = new LoginRequest();
        req.setEmail("taro@example.com");
        req.setPassword("wrong-password");
        when(userMapper.findByEmail("taro@example.com")).thenReturn(Optional.of(user(1L, "taro@example.com", "taro")));
        when(encoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.login(req));
    }

    @Test
    void login_成功時はトークンを発行する() {
        LoginRequest req = new LoginRequest();
        req.setEmail("taro@example.com");
        req.setPassword("password123");
        when(userMapper.findByEmail("taro@example.com")).thenReturn(Optional.of(user(1L, "taro@example.com", "taro")));
        when(encoder.matches("password123", "hashed-password")).thenReturn(true);

        AuthResponse res = authService.login(req);

        assertEquals("taro", res.getUsername());
        assertEquals("access-token", res.getToken());
    }

    @Test
    void refresh_無効なトークンは例外() {
        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("raw-token");
        when(refreshTokenMapper.revokeIfValid("hashed-token")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.refresh(req));
    }

    @Test
    void refresh_有効なトークンなら新しいトークンを発行する() {
        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("raw-token");
        RefreshToken stored = new RefreshToken();
        stored.setUserId(1L);
        when(refreshTokenMapper.revokeIfValid("hashed-token")).thenReturn(Optional.of(stored));
        when(userMapper.findById(1L)).thenReturn(Optional.of(user(1L, "taro@example.com", "taro")));

        AuthResponse res = authService.refresh(req);

        assertEquals("access-token", res.getToken());
        assertEquals("taro", res.getUsername());
    }

    @Test
    void logout_トークンを失効させる() {
        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("raw-token");

        authService.logout(req);

        Mockito.verify(refreshTokenMapper).revokeByTokenHash("hashed-token");
    }

    @Test
    void logout_トークンが空なら何もしない() {
        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken(null);

        authService.logout(req);

        Mockito.verify(refreshTokenMapper, Mockito.never()).revokeByTokenHash(anyString());
    }
}
