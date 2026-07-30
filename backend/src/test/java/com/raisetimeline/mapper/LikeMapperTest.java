package com.raisetimeline.mapper;

import com.raisetimeline.config.MyBatisConfig;
import com.raisetimeline.mapper.support.MapperTestDataFactory;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest
@Import(MyBatisConfig.class)
class LikeMapperTest {

    @Autowired
    private LikeMapper likeMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PostMapper postMapper;

    private Long createUser(String suffix) {
        return MapperTestDataFactory.createUser(userMapper, suffix);
    }

    private Long createPost(Long userId) {
        return MapperTestDataFactory.createPost(postMapper, userId, "投稿本文");
    }

    @Test
    void insertIfAbsentでいいねが作成されcountByPostが増える() {
        Long user = createUser("l1");
        Long post = createPost(user);

        likeMapper.insertIfAbsent(post, user);

        assertThat(likeMapper.countByPost(post)).isEqualTo(1);
    }

    @Test
    void insertIfAbsentは同じ組み合わせを二重に挿入しない() {
        Long user = createUser("l2");
        Long post = createPost(user);

        likeMapper.insertIfAbsent(post, user);
        likeMapper.insertIfAbsent(post, user);

        assertThat(likeMapper.countByPost(post)).isEqualTo(1);
    }

    @Test
    void deleteでいいねが解除されcountByPostが減る() {
        Long user = createUser("l3");
        Long post = createPost(user);
        likeMapper.insertIfAbsent(post, user);

        likeMapper.delete(post, user);

        assertThat(likeMapper.countByPost(post)).isEqualTo(0);
    }
}
