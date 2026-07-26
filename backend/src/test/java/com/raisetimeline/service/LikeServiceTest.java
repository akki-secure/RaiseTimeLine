package com.raisetimeline.service;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.mapper.LikeMapper;
import com.raisetimeline.mapper.PostMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LikeServiceTest {

    private LikeMapper likeMapper;
    private PostMapper postMapper;
    private LikeService likeService;

    @BeforeEach
    void setUp() {
        likeMapper = Mockito.mock(LikeMapper.class);
        postMapper = Mockito.mock(PostMapper.class);
        likeService = new LikeService(likeMapper, postMapper);
    }

    @Test
    void toggle_未いいね状態ならいいねする() {
        when(postMapper.existsById(1L)).thenReturn(true);
        when(likeMapper.delete(1L, 2L)).thenReturn(0);
        when(likeMapper.countByPost(1L)).thenReturn(3);

        LikeResponse res = likeService.toggle(2L, 1L);

        assertTrue(res.isLiked());
        assertEquals(3, res.getLikeCount());
        verify(likeMapper).insertIfAbsent(1L, 2L);
    }

    @Test
    void toggle_いいね済みなら解除する() {
        when(postMapper.existsById(1L)).thenReturn(true);
        when(likeMapper.delete(1L, 2L)).thenReturn(1);
        when(likeMapper.countByPost(1L)).thenReturn(2);

        LikeResponse res = likeService.toggle(2L, 1L);

        assertFalse(res.isLiked());
        assertEquals(2, res.getLikeCount());
        verify(likeMapper, never()).insertIfAbsent(1L, 2L);
    }

    @Test
    void toggle_存在しない投稿はPostNotFoundException() {
        when(postMapper.existsById(1L)).thenReturn(false);
        assertThrows(PostNotFoundException.class, () -> likeService.toggle(2L, 1L));
    }
}
