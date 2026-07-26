package com.raisetimeline.service;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.mapper.FollowMapper;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FollowServiceTest {

    private FollowMapper followMapper;
    private UserMapper userMapper;
    private FollowService followService;

    @BeforeEach
    void setUp() {
        followMapper = Mockito.mock(FollowMapper.class);
        userMapper = Mockito.mock(UserMapper.class);
        followService = new FollowService(followMapper, userMapper);
    }

    private User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        return u;
    }

    @Test
    void toggle_未フォロー状態ならフォローする() {
        when(userMapper.findByUsername("bob")).thenReturn(Optional.of(user(2L, "bob")));
        when(followMapper.delete(1L, 2L)).thenReturn(0);
        when(followMapper.countByFollowee(2L)).thenReturn(5);

        FollowResponse res = followService.toggle(1L, "bob");

        assertTrue(res.isFollowed());
        assertEquals(5, res.getFollowerCount());
        verify(followMapper).insertIfAbsent(1L, 2L);
    }

    @Test
    void toggle_フォロー済みなら解除する() {
        when(userMapper.findByUsername("bob")).thenReturn(Optional.of(user(2L, "bob")));
        when(followMapper.delete(1L, 2L)).thenReturn(1);
        when(followMapper.countByFollowee(2L)).thenReturn(4);

        FollowResponse res = followService.toggle(1L, "bob");

        assertFalse(res.isFollowed());
        assertEquals(4, res.getFollowerCount());
        verify(followMapper, never()).insertIfAbsent(1L, 2L);
    }

    @Test
    void toggle_存在しないユーザーはUserNotFoundException() {
        when(userMapper.findByUsername("nobody")).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> followService.toggle(1L, "nobody"));
    }

    @Test
    void toggle_自分自身は例外() {
        when(userMapper.findByUsername("taro")).thenReturn(Optional.of(user(1L, "taro")));
        assertThrows(RuntimeException.class, () -> followService.toggle(1L, "taro"));
    }
}
