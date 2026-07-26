package com.raisetimeline.mapper;

import com.raisetimeline.model.Post;
import com.raisetimeline.model.PostWithAuthor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface PostMapper {

    List<PostWithAuthor> findPage(@Param("beforeId") Long beforeId, @Param("limit") int limit,
                                   @Param("currentUserId") Long currentUserId);

    List<PostWithAuthor> findNewerThan(@Param("afterId") Long afterId, @Param("currentUserId") Long currentUserId);

    Optional<PostWithAuthor> findById(@Param("id") Long id, @Param("currentUserId") Long currentUserId);

    void insert(Post post);

    Optional<Post> updateIfOwner(@Param("id") Long id, @Param("userId") Long userId, @Param("body") String body);

    int deleteIfOwner(@Param("id") Long id, @Param("userId") Long userId);

    boolean existsById(@Param("id") Long id);
}
