package com.raisetimeline.mapper;

import com.raisetimeline.config.MyBatisConfig;
import com.raisetimeline.mapper.support.MapperTestDataFactory;
import com.raisetimeline.model.RefreshToken;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * revokeIfValid(RETURNING句を使うアトミックな失効SQL)はH2がRETURNING句を未サポートのため対象外。
 * RefreshTokenMapper.xmlのコメントとAuthServiceTestの既存Mockitoテストを参照。
 * insert/revokeByTokenHashのみ実SQLで検証する。
 */
@MybatisTest
@Import(MyBatisConfig.class)
class RefreshTokenMapperTest {

    @Autowired
    private RefreshTokenMapper refreshTokenMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Long createUser(String suffix) {
        return MapperTestDataFactory.createUser(userMapper, suffix);
    }

    private RefreshToken newToken(Long userId, String tokenHash) {
        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setTokenHash(tokenHash);
        token.setExpiresAt(LocalDateTime.now().plusDays(7));
        return token;
    }

    @Test
    void insertでリフレッシュトークンが保存される() {
        Long userId = createUser("r1");
        RefreshToken token = newToken(userId, "hash-r1");

        refreshTokenMapper.insert(token);

        assertThat(token.getId()).isNotNull();
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM refresh_tokens WHERE token_hash = ?", Long.class, "hash-r1");
        assertThat(count).isEqualTo(1L);
    }

    @Test
    void revokeByTokenHashで失効日時が設定される() {
        Long userId = createUser("r2");
        RefreshToken token = newToken(userId, "hash-r2");
        refreshTokenMapper.insert(token);

        int affected = refreshTokenMapper.revokeByTokenHash("hash-r2");

        assertThat(affected).isEqualTo(1);
        LocalDateTime revokedAt = jdbcTemplate.queryForObject(
                "SELECT revoked_at FROM refresh_tokens WHERE token_hash = ?", LocalDateTime.class, "hash-r2");
        assertThat(revokedAt).isNotNull();
    }

    @Test
    void revokeByTokenHashは既に失効済みのトークンには影響しない() {
        Long userId = createUser("r3");
        RefreshToken token = newToken(userId, "hash-r3");
        refreshTokenMapper.insert(token);
        refreshTokenMapper.revokeByTokenHash("hash-r3");

        int affected = refreshTokenMapper.revokeByTokenHash("hash-r3");

        assertThat(affected).isEqualTo(0);
    }

    @Test
    void revokeByTokenHashは存在しないトークンに対して0件を返す() {
        int affected = refreshTokenMapper.revokeByTokenHash("no-such-hash");

        assertThat(affected).isEqualTo(0);
    }
}
