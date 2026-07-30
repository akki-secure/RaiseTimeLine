package com.raisetimeline.mapper;

import com.raisetimeline.config.MyBatisConfig;
import com.raisetimeline.mapper.support.MapperTestDataFactory;
import com.raisetimeline.model.Comment;
import com.raisetimeline.model.CommentWithAuthor;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * updateIfOwner(RETURNING句を使うアトミックな所有権チェックSQL)はH2が
 * RETURNING句を未サポートのため対象外。CommentMapper.xmlのコメントと
 * CommentServiceTestの既存Mockitoテストを参照。
 */
@MybatisTest
@Import(MyBatisConfig.class)
class CommentMapperTest {

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private UserMapper userMapper;

    private Long createUser(String suffix) {
        return MapperTestDataFactory.createUser(userMapper, suffix);
    }

    private Long createPost(Long userId) {
        return MapperTestDataFactory.createPost(postMapper, userId, "投稿本文");
    }

    private Long createComment(Long postId, Long userId, String body) {
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setBody(body);
        LocalDateTime now = LocalDateTime.now();
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        commentMapper.insert(comment);
        return comment.getId();
    }

    @Test
    void insertとfindByIdでコメントが取得でき著者情報が結合される() {
        Long userId = createUser("c1");
        Long postId = createPost(userId);
        Long commentId = createComment(postId, userId, "コメント本文");

        Optional<CommentWithAuthor> found = commentMapper.findById(commentId);

        assertThat(found).isPresent();
        assertThat(found.get().getBody()).isEqualTo("コメント本文");
        assertThat(found.get().getAuthorUsername()).isEqualTo("user_c1");
    }

    @Test
    void 存在しないIDのfindByIdは空を返す() {
        assertThat(commentMapper.findById(999_999L)).isEmpty();
    }

    @Test
    void findByPostIdは古い順にコメント一覧を返す() {
        Long userId = createUser("c2");
        Long postId = createPost(userId);
        createComment(postId, userId, "1つ目");
        createComment(postId, userId, "2つ目");

        List<CommentWithAuthor> comments = commentMapper.findByPostId(postId);

        assertThat(comments).extracting(CommentWithAuthor::getBody).containsExactly("1つ目", "2つ目");
    }

    @Test
    void deleteIfOwnerは所有者本人なら削除できる() {
        Long userId = createUser("c3");
        Long postId = createPost(userId);
        Long commentId = createComment(postId, userId, "削除される");

        int affected = commentMapper.deleteIfOwner(commentId, postId, userId);

        assertThat(affected).isEqualTo(1);
        assertThat(commentMapper.existsByIdAndPostId(commentId, postId)).isFalse();
    }

    @Test
    void deleteIfOwnerは所有者でなければ削除されない() {
        Long owner = createUser("c4");
        Long other = createUser("c5");
        Long postId = createPost(owner);
        Long commentId = createComment(postId, owner, "他人のコメント");

        int affected = commentMapper.deleteIfOwner(commentId, postId, other);

        assertThat(affected).isEqualTo(0);
        assertThat(commentMapper.existsByIdAndPostId(commentId, postId)).isTrue();
    }

    @Test
    void existsByIdAndPostIdはpostIdの不一致を検出する() {
        Long userId = createUser("c6");
        Long postId = createPost(userId);
        Long otherPostId = createPost(userId);
        Long commentId = createComment(postId, userId, "本文");

        assertThat(commentMapper.existsByIdAndPostId(commentId, postId)).isTrue();
        assertThat(commentMapper.existsByIdAndPostId(commentId, otherPostId)).isFalse();
    }
}
