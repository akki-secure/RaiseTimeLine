package com.raisetimeline.mapper.support;

import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.model.Post;
import com.raisetimeline.model.User;

import java.time.LocalDateTime;

/** Mapperテスト間で重複していたテストデータ生成処理をまとめたヘルパー。 */
public final class MapperTestDataFactory {

    private MapperTestDataFactory() {}

    public static Long createUser(UserMapper userMapper, String suffix) {
        User user = new User();
        user.setEmail(suffix + "@example.com");
        user.setPasswordHash("hashed-password");
        user.setUsername("user_" + suffix);
        user.setDisplayName("User " + suffix);
        userMapper.insert(user);
        return user.getId();
    }

    public static Long createPost(PostMapper postMapper, Long userId, String body) {
        Post post = new Post();
        post.setUserId(userId);
        post.setBody(body);
        LocalDateTime now = LocalDateTime.now();
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        postMapper.insert(post);
        return post.getId();
    }
}
