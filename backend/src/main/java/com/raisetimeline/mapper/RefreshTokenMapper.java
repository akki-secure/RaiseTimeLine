package com.raisetimeline.mapper;

import com.raisetimeline.model.RefreshToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

@Mapper
public interface RefreshTokenMapper {

    void insert(RefreshToken refreshToken);

    Optional<RefreshToken> revokeIfValid(@Param("tokenHash") String tokenHash);

    int revokeByTokenHash(@Param("tokenHash") String tokenHash);
}
