package com.raisetimeline.mapper;

import com.raisetimeline.config.MyBatisConfig;
import com.raisetimeline.mapper.support.MapperTestDataFactory;
import com.raisetimeline.model.User;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest
@Import(MyBatisConfig.class)
class FollowMapperTest {

    @Autowired
    private FollowMapper followMapper;

    @Autowired
    private UserMapper userMapper;

    private Long createUser(String suffix) {
        return MapperTestDataFactory.createUser(userMapper, suffix);
    }

    @Test
    void insertIfAbsentでフォローが作成されexistsがtrueになる() {
        Long follower = createUser("f1");
        Long followee = createUser("f2");

        followMapper.insertIfAbsent(follower, followee);

        assertThat(followMapper.exists(follower, followee)).isTrue();
        assertThat(followMapper.countByFollower(follower)).isEqualTo(1);
        assertThat(followMapper.countByFollowee(followee)).isEqualTo(1);
    }

    @Test
    void insertIfAbsentは同じ組み合わせを二重に挿入しない() {
        Long follower = createUser("f3");
        Long followee = createUser("f4");

        followMapper.insertIfAbsent(follower, followee);
        followMapper.insertIfAbsent(follower, followee);

        assertThat(followMapper.countByFollower(follower)).isEqualTo(1);
    }

    @Test
    void deleteでフォローが解除される() {
        Long follower = createUser("f5");
        Long followee = createUser("f6");
        followMapper.insertIfAbsent(follower, followee);

        followMapper.delete(follower, followee);

        assertThat(followMapper.exists(follower, followee)).isFalse();
    }

    @Test
    void findFollowingとfindFollowersで一覧が取得できる() {
        Long follower = createUser("f7");
        Long followee = createUser("f8");
        followMapper.insertIfAbsent(follower, followee);

        List<User> following = followMapper.findFollowing(follower, 20);
        List<User> followers = followMapper.findFollowers(followee, 20);

        assertThat(following).extracting(User::getId).containsExactly(followee);
        assertThat(followers).extracting(User::getId).containsExactly(follower);
    }

    @Test
    void findSuggestionsは自分自身とフォロー済みユーザーを除外する() {
        Long me = createUser("f9");
        Long alreadyFollowed = createUser("f10");
        Long notFollowedYet = createUser("f11");
        followMapper.insertIfAbsent(me, alreadyFollowed);

        List<User> suggestions = followMapper.findSuggestions(me, 20);

        assertThat(suggestions).extracting(User::getId)
                .contains(notFollowedYet)
                .doesNotContain(me, alreadyFollowed);
    }
}
