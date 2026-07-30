package com.raisetimeline.mapper;

import com.raisetimeline.config.MyBatisConfig;
import com.raisetimeline.mapper.support.MapperTestDataFactory;
import com.raisetimeline.model.PostWithAuthor;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * updateIfOwner(RETURNING句を使うアトミックな所有権チェックSQL)はH2が
 * RETURNING句を未サポートのため対象外。PostMapper.xmlのコメントと
 * PostServiceTestの既存Mockitoテストを参照。
 */
@MybatisTest
@Import(MyBatisConfig.class)
class PostMapperTest {

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private UserMapper userMapper;

    private Long createUser(String suffix) {
        return MapperTestDataFactory.createUser(userMapper, suffix);
    }

    private Long createPost(Long userId, String body) {
        return MapperTestDataFactory.createPost(postMapper, userId, body);
    }

    @Test
    void insertとfindByIdで投稿が取得でき著者情報が結合される() {
        Long userId = createUser("p1");
        Long postId = createPost(userId, "はじめての投稿");

        Optional<PostWithAuthor> found = postMapper.findById(postId, -1L);

        assertThat(found).isPresent();
        assertThat(found.get().getBody()).isEqualTo("はじめての投稿");
        assertThat(found.get().getAuthorUsername()).isEqualTo("user_p1");
        assertThat(found.get().getLikeCount()).isEqualTo(0);
        assertThat(found.get().isLikedByMe()).isFalse();
    }

    @Test
    void 存在しないIDのfindByIdは空を返す() {
        assertThat(postMapper.findById(999_999L, -1L)).isEmpty();
    }

    @Test
    void findPageは新しい投稿順にlimit件返す() {
        Long userId = createUser("p2");
        createPost(userId, "投稿1");
        createPost(userId, "投稿2");
        createPost(userId, "投稿3");

        List<PostWithAuthor> page = postMapper.findPage(null, 2, -1L);

        assertThat(page).hasSize(2);
        assertThat(page.get(0).getBody()).isEqualTo("投稿3");
        assertThat(page.get(1).getBody()).isEqualTo("投稿2");
    }

    @Test
    void findPageはbeforeIdより前の投稿だけ返す() {
        Long userId = createUser("p3");
        Long first = createPost(userId, "投稿A");
        createPost(userId, "投稿B");

        List<PostWithAuthor> page = postMapper.findPage(first + 1, 10, -1L);

        assertThat(page).extracting(PostWithAuthor::getId).contains(first);
    }

    @Test
    void findPageByUserIdは指定ユーザーの投稿のみ返す() {
        Long userA = createUser("p4");
        Long userB = createUser("p5");
        createPost(userA, "Aの投稿");
        createPost(userB, "Bの投稿");

        List<PostWithAuthor> page = postMapper.findPageByUserId(userA, null, 10, -1L);

        assertThat(page).extracting(PostWithAuthor::getBody).containsExactly("Aの投稿");
    }

    @Test
    void findNewerThanはafterIdより新しい投稿を返す() {
        Long userId = createUser("p6");
        Long first = createPost(userId, "投稿old");
        Long second = createPost(userId, "投稿new");

        List<PostWithAuthor> newer = postMapper.findNewerThan(first, -1L);

        assertThat(newer).extracting(PostWithAuthor::getId).containsExactly(second);
    }

    @Test
    void deleteIfOwnerは所有者本人なら削除できる() {
        Long userId = createUser("p7");
        Long postId = createPost(userId, "削除される投稿");

        int affected = postMapper.deleteIfOwner(postId, userId);

        assertThat(affected).isEqualTo(1);
        assertThat(postMapper.existsById(postId)).isFalse();
    }

    @Test
    void deleteIfOwnerは所有者でなければ削除されない() {
        Long owner = createUser("p8");
        Long other = createUser("p9");
        Long postId = createPost(owner, "他人の投稿");

        int affected = postMapper.deleteIfOwner(postId, other);

        assertThat(affected).isEqualTo(0);
        assertThat(postMapper.existsById(postId)).isTrue();
    }

    @Test
    void existsByIdは存在有無を正しく返す() {
        Long userId = createUser("p10");
        Long postId = createPost(userId, "存在確認用");

        assertThat(postMapper.existsById(postId)).isTrue();
        assertThat(postMapper.existsById(999_999L)).isFalse();
    }
}
