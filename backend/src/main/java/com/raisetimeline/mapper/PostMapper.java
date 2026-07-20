package com.raisetimeline.mapper;

import com.raisetimeline.model.Post;
import com.raisetimeline.model.PostWithAuthor;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface PostMapper {

    String SELECT_COLUMNS =
            "p.id, p.user_id, p.body, p.created_at, p.updated_at, " +
            "u.username AS author_username, u.display_name AS author_display_name ";

    // idはBIGSERIALで挿入順に単調増加し、編集ではid/created_atとも変化しないため、
    // idだけを安定したページネーションカーソルとして使える（offset方式と違い新着投稿が挟まっても重複/欠落しない）。
    @Select("SELECT " + SELECT_COLUMNS +
            "FROM posts p JOIN users u ON u.id = p.user_id " +
            "WHERE (CAST(#{beforeId} AS BIGINT) IS NULL OR p.id < CAST(#{beforeId} AS BIGINT)) " +
            "ORDER BY p.id DESC LIMIT #{limit}")
    List<PostWithAuthor> findPage(@Param("beforeId") Long beforeId, @Param("limit") int limit);

    @Select("SELECT " + SELECT_COLUMNS +
            "FROM posts p JOIN users u ON u.id = p.user_id " +
            "WHERE p.id > #{afterId} ORDER BY p.id DESC")
    List<PostWithAuthor> findNewerThan(@Param("afterId") Long afterId);

    @Select("SELECT " + SELECT_COLUMNS +
            "FROM posts p JOIN users u ON u.id = p.user_id " +
            "WHERE p.id = #{id}")
    Optional<PostWithAuthor> findById(@Param("id") Long id);

    @Insert("INSERT INTO posts (user_id, body, created_at, updated_at) " +
            "VALUES (#{userId}, #{body}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Post post);

    // 所有権チェックと更新をアトミックに行う。RefreshTokenMapper.revokeIfValidと同じ設計で、
    // 「本人の投稿か」の検証と本体の更新を分けないことでTOCTOU競合を防ぐ。
    @Select("UPDATE posts SET body = #{body}, updated_at = NOW() " +
            "WHERE id = #{id} AND user_id = #{userId} " +
            "RETURNING id, user_id, body, created_at, updated_at")
    Optional<Post> updateIfOwner(@Param("id") Long id, @Param("userId") Long userId, @Param("body") String body);

    @Delete("DELETE FROM posts WHERE id = #{id} AND user_id = #{userId}")
    int deleteIfOwner(@Param("id") Long id, @Param("userId") Long userId);

    @Select("SELECT EXISTS(SELECT 1 FROM posts WHERE id = #{id})")
    boolean existsById(@Param("id") Long id);
}
