package com.raisetimeline.mapper;

import com.raisetimeline.model.Comment;
import com.raisetimeline.model.CommentWithAuthor;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CommentMapper {

    String SELECT_COLUMNS =
            "c.id, c.post_id, c.user_id, c.body, c.created_at, c.updated_at, " +
            "u.username AS author_username, u.display_name AS author_display_name ";

    @Select("SELECT " + SELECT_COLUMNS +
            "FROM comments c JOIN users u ON u.id = c.user_id " +
            "WHERE c.post_id = #{postId} ORDER BY c.id ASC")
    List<CommentWithAuthor> findByPostId(@Param("postId") Long postId);

    @Select("SELECT " + SELECT_COLUMNS +
            "FROM comments c JOIN users u ON u.id = c.user_id " +
            "WHERE c.id = #{id}")
    Optional<CommentWithAuthor> findById(@Param("id") Long id);

    @Insert("INSERT INTO comments (post_id, user_id, body, created_at, updated_at) " +
            "VALUES (#{postId}, #{userId}, #{body}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Comment comment);

    // 所有権チェックと更新をアトミックに行う（PostMapper.updateIfOwnerと同じ設計）。
    // post_idも条件に含め、URLパスのpostIdとコメントの実際の親投稿が一致することも保証する。
    @Select("UPDATE comments SET body = #{body}, updated_at = NOW() " +
            "WHERE id = #{id} AND post_id = #{postId} AND user_id = #{userId} " +
            "RETURNING id, post_id, user_id, body, created_at, updated_at")
    Optional<Comment> updateIfOwner(@Param("id") Long id, @Param("postId") Long postId,
                                     @Param("userId") Long userId, @Param("body") String body);

    @Delete("DELETE FROM comments WHERE id = #{id} AND post_id = #{postId} AND user_id = #{userId}")
    int deleteIfOwner(@Param("id") Long id, @Param("postId") Long postId, @Param("userId") Long userId);

    @Select("SELECT EXISTS(SELECT 1 FROM comments WHERE id = #{id} AND post_id = #{postId})")
    boolean existsByIdAndPostId(@Param("id") Long id, @Param("postId") Long postId);
}
