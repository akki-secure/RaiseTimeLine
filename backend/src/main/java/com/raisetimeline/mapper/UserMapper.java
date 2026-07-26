package com.raisetimeline.mapper;

import com.raisetimeline.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface UserMapper {

    Optional<User> findByEmail(@Param("email") String email);

    Optional<User> findById(@Param("id") Long id);

    Optional<User> findByUsername(@Param("username") String username);

    boolean existsByEmail(@Param("email") String email);

    boolean existsByUsername(@Param("username") String username);

    List<User> searchByKeyword(@Param("pattern") String pattern, @Param("currentUserId") Long currentUserId,
                                @Param("limit") int limit);

    void insert(User user);

    void updateBio(@Param("id") Long id, @Param("bio") String bio);
}
