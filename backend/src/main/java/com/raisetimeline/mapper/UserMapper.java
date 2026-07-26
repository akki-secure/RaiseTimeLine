package com.raisetimeline.mapper;

import com.raisetimeline.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

@Mapper
public interface UserMapper {

    Optional<User> findByEmail(@Param("email") String email);

    Optional<User> findById(@Param("id") Long id);

    boolean existsByEmail(@Param("email") String email);

    boolean existsByUsername(@Param("username") String username);

    void insert(User user);
}
