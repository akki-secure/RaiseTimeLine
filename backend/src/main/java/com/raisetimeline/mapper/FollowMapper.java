package com.raisetimeline.mapper;

import com.raisetimeline.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FollowMapper {

    int insertIfAbsent(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    int delete(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    int countByFollower(@Param("userId") Long userId);

    int countByFollowee(@Param("userId") Long userId);

    boolean exists(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    List<User> findFollowing(@Param("userId") Long userId, @Param("limit") int limit);

    List<User> findFollowers(@Param("userId") Long userId, @Param("limit") int limit);

    List<User> findSuggestions(@Param("currentUserId") Long currentUserId, @Param("limit") int limit);
}
