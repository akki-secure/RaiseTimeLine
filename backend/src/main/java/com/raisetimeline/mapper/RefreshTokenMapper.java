package com.raisetimeline.mapper;

import com.raisetimeline.model.RefreshToken;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.Optional;

@Mapper
public interface RefreshTokenMapper {

    @Insert("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) " +
            "VALUES (#{userId}, #{tokenHash}, #{expiresAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(RefreshToken refreshToken);

    // 有効なトークンのみを原子的に失効させ、失効させたレコードを返す。
    // SELECTでの検証とUPDATEでの失効を分けないことで、同一トークンへの同時リクエストが
    // どちらも「有効」と判定してしまう競合(TOCTOU)を防ぐ。
    @Select("UPDATE refresh_tokens SET revoked_at = NOW() " +
            "WHERE token_hash = #{tokenHash} AND revoked_at IS NULL AND expires_at > NOW() " +
            "RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at")
    Optional<RefreshToken> revokeIfValid(@Param("tokenHash") String tokenHash);

    @Update("UPDATE refresh_tokens SET revoked_at = NOW() " +
            "WHERE token_hash = #{tokenHash} AND revoked_at IS NULL")
    int revokeByTokenHash(@Param("tokenHash") String tokenHash);
}
