package com.raisetimeline.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LikeMapper {

    int insertIfAbsent(@Param("postId") Long postId, @Param("userId") Long userId);

    int delete(@Param("postId") Long postId, @Param("userId") Long userId);

    int countByPost(@Param("postId") Long postId);
}
