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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Transactional
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");

    private final UserMapper userMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserMapper userMapper, RefreshTokenMapper refreshTokenMapper,
                        BCryptPasswordEncoder encoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.refreshTokenMapper = refreshTokenMapper;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest req) {
        String email = req.getEmail() == null ? null : req.getEmail().strip();
        String password = req.getPassword();
        String username = req.getUsername() == null ? null : req.getUsername().strip();
        String displayName = req.getDisplayName() == null ? null : req.getDisplayName().strip();

        if (email == null || email.isBlank() || !EMAIL_PATTERN.matcher(email).matches())
            throw new RuntimeException("メールアドレスの形式が正しくありません");
        if (password == null || password.length() < 8)
            throw new RuntimeException("パスワードは8文字以上で入力してください");
        if (username == null || !USERNAME_PATTERN.matcher(username).matches())
            throw new RuntimeException("ユーザー名は英数字と_のみ、3〜20文字で入力してください");
        if (displayName == null || displayName.isBlank() || displayName.length() > 50)
            throw new RuntimeException("表示名は1〜50文字で入力してください");

        if (userMapper.existsByEmail(email))
            throw new RuntimeException("このメールアドレスはすでに登録されています");
        if (userMapper.existsByUsername(username))
            throw new RuntimeException("このユーザー名はすでに使用されています");

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(password));
        user.setUsername(username);
        user.setDisplayName(displayName);
        userMapper.insert(user);

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail() == null ? null : req.getEmail().strip();
        String password = req.getPassword();

        if (email == null || email.isBlank() || password == null || password.isBlank())
            throw new RuntimeException("メールアドレスまたはパスワードが正しくありません");

        Optional<User> userOpt = userMapper.findByEmail(email);
        User user = userOpt.orElseThrow(() -> new RuntimeException("メールアドレスまたはパスワードが正しくありません"));

        if (!encoder.matches(password, user.getPasswordHash()))
            throw new RuntimeException("メールアドレスまたはパスワードが正しくありません");

        return issueTokens(user);
    }

    public AuthResponse refresh(RefreshTokenRequest req) {
        String rawToken = req.getRefreshToken();
        if (rawToken == null || rawToken.isBlank())
            throw new RuntimeException("リフレッシュトークンが不正です");

        String hash = jwtUtil.hashToken(rawToken);
        RefreshToken stored = refreshTokenMapper.revokeIfValid(hash)
                .orElseThrow(() -> new RuntimeException("リフレッシュトークンが無効です"));

        User user = userMapper.findById(stored.getUserId())
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

        return issueTokens(user);
    }

    public void logout(RefreshTokenRequest req) {
        String rawToken = req.getRefreshToken();
        if (rawToken == null || rawToken.isBlank())
            return;
        String hash = jwtUtil.hashToken(rawToken);
        refreshTokenMapper.revokeByTokenHash(hash);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtUtil.generateToken(user.getId(), user.getUsername());

        String rawRefreshToken = jwtUtil.generateRefreshToken();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setTokenHash(jwtUtil.hashToken(rawRefreshToken));
        refreshToken.setExpiresAt(LocalDateTime.now().plus(Duration.ofMillis(jwtUtil.getRefreshExpirationMs())));
        refreshTokenMapper.insert(refreshToken);

        return new AuthResponse(accessToken, rawRefreshToken, user.getId(), user.getUsername(),
                user.getDisplayName(), user.getEmail());
    }
}
