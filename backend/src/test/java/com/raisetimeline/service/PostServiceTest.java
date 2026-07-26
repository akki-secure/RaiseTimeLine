package com.raisetimeline.service;

import com.raisetimeline.dto.PostRequest;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.model.Post;
import com.raisetimeline.model.PostWithAuthor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class PostServiceTest {

    private PostMapper postMapper;
    private ImageStorageService imageStorageService;
    private PostService postService;

    @BeforeEach
    void setUp() {
        postMapper = Mockito.mock(PostMapper.class);
        imageStorageService = Mockito.mock(ImageStorageService.class);
        postService = new PostService(postMapper, imageStorageService);
    }

    private PostWithAuthor withAuthor(Long id, Long userId, String body, LocalDateTime createdAt, LocalDateTime updatedAt) {
        PostWithAuthor p = new PostWithAuthor();
        p.setId(id);
        p.setUserId(userId);
        p.setBody(body);
        p.setCreatedAt(createdAt);
        p.setUpdatedAt(updatedAt);
        p.setAuthorUsername("taro_dev");
        p.setAuthorDisplayName("太郎");
        return p;
    }

    @Test
    void create_空本文は例外() {
        assertThrows(RuntimeException.class, () -> postService.create(1L, "   ", null));
    }

    @Test
    void create_281文字は例外() {
        assertThrows(RuntimeException.class, () -> postService.create(1L, "あ".repeat(281), null));
    }

    @Test
    void create_成功時はmineがtrue() {
        Mockito.doAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setId(10L);
            return null;
        }).when(postMapper).insert(any(Post.class));

        LocalDateTime now = LocalDateTime.now();
        when(postMapper.findById(10L, 1L)).thenReturn(Optional.of(withAuthor(10L, 1L, "こんにちは", now, now)));

        PostResponse res = postService.create(1L, "こんにちは", null);

        assertTrue(res.isMine());
        assertEquals("こんにちは", res.getBody());
        assertFalse(res.isEdited());
    }

    @Test
    void listPage_他人の投稿はmineがfalse() {
        LocalDateTime now = LocalDateTime.now();
        when(postMapper.findPage(null, 20, 1L)).thenReturn(
                List.of(withAuthor(1L, 2L, "他人の投稿", now, now)));

        List<PostResponse> result = postService.listPage(1L, null, null);

        assertEquals(1, result.size());
        assertFalse(result.get(0).isMine());
    }

    @Test
    void listPage_limitは最大50にクランプされる() {
        when(postMapper.findPage(null, 50, 1L)).thenReturn(List.of());
        postService.listPage(1L, null, 999);
        Mockito.verify(postMapper).findPage(null, 50, 1L);
    }

    @Test
    void listNewerThan_新着投稿を返す() {
        LocalDateTime now = LocalDateTime.now();
        when(postMapper.findNewerThan(10L, 1L)).thenReturn(
                List.of(withAuthor(11L, 2L, "新着", now, now)));

        List<PostResponse> result = postService.listNewerThan(1L, 10L);

        assertEquals(1, result.size());
        assertEquals(11L, result.get(0).getId());
    }

    @Test
    void update_所有者本人なら成功() {
        LocalDateTime createdAt = LocalDateTime.now().minusHours(1);
        LocalDateTime updatedAt = LocalDateTime.now();

        PostRequest req = new PostRequest();
        req.setBody("編集後");

        Post updated = new Post();
        updated.setId(5L);
        updated.setUserId(1L);
        updated.setBody("編集後");
        updated.setCreatedAt(createdAt);
        updated.setUpdatedAt(updatedAt);

        when(postMapper.updateIfOwner(5L, 1L, "編集後")).thenReturn(Optional.of(updated));
        when(postMapper.findById(5L, 1L)).thenReturn(Optional.of(withAuthor(5L, 1L, "編集後", createdAt, updatedAt)));

        PostResponse res = postService.update(1L, 5L, req);

        assertTrue(res.isEdited());
        assertTrue(res.isMine());
    }

    @Test
    void update_他人の投稿なら403() {
        PostRequest req = new PostRequest();
        req.setBody("改ざん");

        when(postMapper.updateIfOwner(5L, 2L, "改ざん")).thenReturn(Optional.empty());
        when(postMapper.existsById(5L)).thenReturn(true);

        assertThrows(ForbiddenException.class, () -> postService.update(2L, 5L, req));
    }

    @Test
    void update_存在しない投稿なら404() {
        PostRequest req = new PostRequest();
        req.setBody("編集");

        when(postMapper.updateIfOwner(999L, 1L, "編集")).thenReturn(Optional.empty());
        when(postMapper.existsById(999L)).thenReturn(false);

        assertThrows(PostNotFoundException.class, () -> postService.update(1L, 999L, req));
    }

    @Test
    void delete_所有者本人なら成功() {
        when(postMapper.deleteIfOwner(5L, 1L)).thenReturn(1);
        assertDoesNotThrow(() -> postService.delete(1L, 5L));
    }

    @Test
    void delete_他人の投稿なら403() {
        when(postMapper.deleteIfOwner(5L, 2L)).thenReturn(0);
        when(postMapper.existsById(5L)).thenReturn(true);

        assertThrows(ForbiddenException.class, () -> postService.delete(2L, 5L));
    }

    @Test
    void delete_存在しない投稿なら404() {
        when(postMapper.deleteIfOwner(999L, 1L)).thenReturn(0);
        when(postMapper.existsById(999L)).thenReturn(false);

        assertThrows(PostNotFoundException.class, () -> postService.delete(1L, 999L));
    }
}
