package com.raisetimeline.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LikeMapper {

    // UNIQUE(post_id, user_id)違反をON CONFLICT DO NOTHINGで吸収する。
    @Insert("INSERT INTO likes (post_id, user_id, created_at) " +
            "VALUES (#{postId}, #{userId}, NOW()) " +
            "ON CONFLICT (post_id, user_id) DO NOTHING")
    int insertIfAbsent(@Param("postId") Long postId, @Param("userId") Long userId);

    @Delete("DELETE FROM likes WHERE post_id = #{postId} AND user_id = #{userId}")
    int delete(@Param("postId") Long postId, @Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM likes WHERE post_id = #{postId}")
    int countByPost(@Param("postId") Long postId);
}
