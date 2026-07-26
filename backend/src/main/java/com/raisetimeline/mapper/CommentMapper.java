package com.raisetimeline.mapper;

import com.raisetimeline.model.Comment;
import com.raisetimeline.model.CommentWithAuthor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CommentMapper {

    List<CommentWithAuthor> findByPostId(@Param("postId") Long postId);

    Optional<CommentWithAuthor> findById(@Param("id") Long id);

    void insert(Comment comment);

    Optional<Comment> updateIfOwner(@Param("id") Long id, @Param("postId") Long postId,
                                     @Param("userId") Long userId, @Param("body") String body);

    int deleteIfOwner(@Param("id") Long id, @Param("postId") Long postId, @Param("userId") Long userId);

    boolean existsByIdAndPostId(@Param("id") Long id, @Param("postId") Long postId);
}
