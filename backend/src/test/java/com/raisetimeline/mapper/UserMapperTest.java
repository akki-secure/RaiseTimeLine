package com.raisetimeline.mapper;

import com.raisetimeline.config.MyBatisConfig;
import com.raisetimeline.model.User;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest
@Import(MyBatisConfig.class)
class UserMapperTest {

    @Autowired
    private UserMapper userMapper;

    private User newUser(String email, String username, String displayName) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hashed-password");
        user.setUsername(username);
        user.setDisplayName(displayName);
        return user;
    }

    @Test
    void insertとfindByIdで同じユーザーが取得できる() {
        User user = newUser("alice@example.com", "alice", "Alice");

        userMapper.insert(user);

        assertThat(user.getId()).isNotNull();
        Optional<User> found = userMapper.findById(user.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("alice@example.com");
        assertThat(found.get().getUsername()).isEqualTo("alice");
    }

    @Test
    void 存在しないIDのfindByIdは空を返す() {
        assertThat(userMapper.findById(999_999L)).isEmpty();
    }

    @Test
    void findByEmailとfindByUsernameで取得できる() {
        User user = newUser("bob@example.com", "bob", "Bob");
        userMapper.insert(user);

        assertThat(userMapper.findByEmail("bob@example.com")).isPresent();
        assertThat(userMapper.findByUsername("bob")).isPresent();
        assertThat(userMapper.findByEmail("nobody@example.com")).isEmpty();
    }

    @Test
    void existsByEmailとexistsByUsernameは重複時にtrueを返す() {
        User user = newUser("carol@example.com", "carol", "Carol");
        userMapper.insert(user);

        assertThat(userMapper.existsByEmail("carol@example.com")).isTrue();
        assertThat(userMapper.existsByUsername("carol")).isTrue();
        assertThat(userMapper.existsByEmail("nobody@example.com")).isFalse();
        assertThat(userMapper.existsByUsername("nobody")).isFalse();
    }

    @Test
    void updateBioでbioが更新される() {
        User user = newUser("dave@example.com", "dave", "Dave");
        userMapper.insert(user);

        userMapper.updateBio(user.getId(), "よろしくお願いします");

        User updated = userMapper.findById(user.getId()).orElseThrow();
        assertThat(updated.getBio()).isEqualTo("よろしくお願いします");
    }

    @Test
    void searchByKeywordはusernameとdisplayNameを大文字小文字無視で部分一致検索する() {
        User target = newUser("eve@example.com", "eve_search", "Eve Target");
        userMapper.insert(target);
        User other = newUser("frank@example.com", "frank", "Frank Other");
        userMapper.insert(other);

        List<User> byUsername = userMapper.searchByKeyword("%EVE%", -1L, 20);
        assertThat(byUsername).extracting(User::getUsername).containsExactly("eve_search");

        List<User> byDisplayName = userMapper.searchByKeyword("%target%", -1L, 20);
        assertThat(byDisplayName).extracting(User::getUsername).containsExactly("eve_search");
    }

    @Test
    void searchByKeywordはcurrentUserIdを除外する() {
        User self = newUser("grace@example.com", "grace", "Grace Self");
        userMapper.insert(self);

        List<User> result = userMapper.searchByKeyword("%grace%", self.getId(), 20);

        assertThat(result).isEmpty();
    }
}
