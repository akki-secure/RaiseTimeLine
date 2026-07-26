package com.raisetimeline.service;

import com.raisetimeline.dto.CommentRequest;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.exception.CommentNotFoundException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.mapper.CommentMapper;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.model.Comment;
import com.raisetimeline.model.CommentWithAuthor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class CommentServiceTest {

    private CommentMapper commentMapper;
    private PostMapper postMapper;
    private CommentService commentService;

    @BeforeEach
    void setUp() {
        commentMapper = Mockito.mock(CommentMapper.class);
        postMapper = Mockito.mock(PostMapper.class);
        commentService = new CommentService(commentMapper, postMapper);
    }

    private CommentWithAuthor withAuthor(Long id, Long postId, Long userId, String body,
                                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        CommentWithAuthor c = new CommentWithAuthor();
        c.setId(id);
        c.setPostId(postId);
        c.setUserId(userId);
        c.setBody(body);
        c.setCreatedAt(createdAt);
        c.setUpdatedAt(updatedAt);
        c.setAuthorUsername("taro_dev");
        c.setAuthorDisplayName("太郎");
        return c;
    }

    @Test
    void create_空本文は例外() {
        when(postMapper.existsById(1L)).thenReturn(true);
        CommentRequest req = new CommentRequest();
        req.setBody("   ");
        assertThrows(RuntimeException.class, () -> commentService.create(1L, 1L, req));
    }

    @Test
    void create_281文字は例外() {
        when(postMapper.existsById(1L)).thenReturn(true);
        CommentRequest req = new CommentRequest();
        req.setBody("あ".repeat(281));
        assertThrows(RuntimeException.class, () -> commentService.create(1L, 1L, req));
    }

    @Test
    void create_親投稿が存在しなければPostNotFoundException() {
        when(postMapper.existsById(1L)).thenReturn(false);
        CommentRequest req = new CommentRequest();
        req.setBody("こんにちは");
        assertThrows(PostNotFoundException.class, () -> commentService.create(1L, 1L, req));
    }

    @Test
    void create_成功時はmineがtrue() {
        when(postMapper.existsById(1L)).thenReturn(true);
        CommentRequest req = new CommentRequest();
        req.setBody("こんにちは");

        Mockito.doAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId(10L);
            return null;
        }).when(commentMapper).insert(any(Comment.class));

        LocalDateTime now = LocalDateTime.now();
        when(commentMapper.findById(10L)).thenReturn(Optional.of(withAuthor(10L, 1L, 1L, "こんにちは", now, now)));

        CommentResponse res = commentService.create(1L, 1L, req);

        assertTrue(res.isMine());
        assertEquals("こんにちは", res.getBody());
        assertFalse(res.isEdited());
    }

    @Test
    void listByPost_他人のコメントはmineがfalse() {
        when(postMapper.existsById(1L)).thenReturn(true);
        LocalDateTime now = LocalDateTime.now();
        when(commentMapper.findByPostId(1L)).thenReturn(
                List.of(withAuthor(5L, 1L, 2L, "他人のコメント", now, now)));

        List<CommentResponse> result = commentService.listByPost(1L, 1L);

        assertEquals(1, result.size());
        assertFalse(result.get(0).isMine());
    }

    @Test
    void listByPost_親投稿が存在しなければPostNotFoundException() {
        when(postMapper.existsById(1L)).thenReturn(false);
        assertThrows(PostNotFoundException.class, () -> commentService.listByPost(1L, 1L));
    }

    @Test
    void update_所有者本人なら成功() {
        LocalDateTime createdAt = LocalDateTime.now().minusHours(1);
        LocalDateTime updatedAt = LocalDateTime.now();

        CommentRequest req = new CommentRequest();
        req.setBody("編集後");

        Comment updated = new Comment();
        updated.setId(5L);
        updated.setPostId(1L);
        updated.setUserId(1L);
        updated.setBody("編集後");
        updated.setCreatedAt(createdAt);
        updated.setUpdatedAt(updatedAt);

        when(commentMapper.updateIfOwner(5L, 1L, 1L, "編集後")).thenReturn(Optional.of(updated));
        when(commentMapper.findById(5L)).thenReturn(Optional.of(withAuthor(5L, 1L, 1L, "編集後", createdAt, updatedAt)));

        CommentResponse res = commentService.update(1L, 1L, 5L, req);

        assertTrue(res.isEdited());
        assertTrue(res.isMine());
    }

    @Test
    void update_他人のコメントなら403() {
        CommentRequest req = new CommentRequest();
        req.setBody("改ざん");

        when(commentMapper.updateIfOwner(5L, 1L, 2L, "改ざん")).thenReturn(Optional.empty());
        when(commentMapper.existsByIdAndPostId(5L, 1L)).thenReturn(true);

        assertThrows(ForbiddenException.class, () -> commentService.update(2L, 1L, 5L, req));
    }

    @Test
    void update_存在しないコメントなら404() {
        CommentRequest req = new CommentRequest();
        req.setBody("編集");

        when(commentMapper.updateIfOwner(999L, 1L, 1L, "編集")).thenReturn(Optional.empty());
        when(commentMapper.existsByIdAndPostId(999L, 1L)).thenReturn(false);

        assertThrows(CommentNotFoundException.class, () -> commentService.update(1L, 1L, 999L, req));
    }

    @Test
    void delete_所有者本人なら成功() {
        when(commentMapper.deleteIfOwner(5L, 1L, 1L)).thenReturn(1);
        assertDoesNotThrow(() -> commentService.delete(1L, 1L, 5L));
    }

    @Test
    void delete_他人のコメントなら403() {
        when(commentMapper.deleteIfOwner(5L, 1L, 2L)).thenReturn(0);
        when(commentMapper.existsByIdAndPostId(5L, 1L)).thenReturn(true);

        assertThrows(ForbiddenException.class, () -> commentService.delete(2L, 1L, 5L));
    }

    @Test
    void delete_存在しないコメントなら404() {
        when(commentMapper.deleteIfOwner(999L, 1L, 1L)).thenReturn(0);
        when(commentMapper.existsByIdAndPostId(999L, 1L)).thenReturn(false);

        assertThrows(CommentNotFoundException.class, () -> commentService.delete(1L, 1L, 999L));
    }
}
