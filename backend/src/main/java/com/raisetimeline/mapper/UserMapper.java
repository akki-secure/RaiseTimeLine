package com.raisetimeline.mapper;

import com.raisetimeline.model.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Optional;

@Mapper
public interface UserMapper {

    @Select("SELECT id, email, password_hash, username, display_name, bio, avatar_url, created_at, updated_at " +
            "FROM users WHERE email = #{email}")
    Optional<User> findByEmail(@Param("email") String email);

    @Select("SELECT id, email, password_hash, username, display_name, bio, avatar_url, created_at, updated_at " +
            "FROM users WHERE id = #{id}")
    Optional<User> findById(@Param("id") Long id);

    @Select("SELECT EXISTS(SELECT 1 FROM users WHERE email = #{email})")
    boolean existsByEmail(@Param("email") String email);

    @Select("SELECT EXISTS(SELECT 1 FROM users WHERE username = #{username})")
    boolean existsByUsername(@Param("username") String username);

    @Insert("INSERT INTO users (email, password_hash, username, display_name) " +
            "VALUES (#{email}, #{passwordHash}, #{username}, #{displayName})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(User user);
}
