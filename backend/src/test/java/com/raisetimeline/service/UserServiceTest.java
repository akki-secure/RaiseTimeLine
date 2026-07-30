package com.raisetimeline.service;

import com.raisetimeline.dto.UserProfileResponse;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.mapper.FollowMapper;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserMapper userMapper;
    private FollowMapper followMapper;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userMapper = Mockito.mock(UserMapper.class);
        followMapper = Mockito.mock(FollowMapper.class);
        userService = new UserService(userMapper, followMapper);
    }

    private User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setDisplayName("表示名");
        return u;
    }

    @Test
    void getProfile_存在しないユーザーは例外() {
        when(userMapper.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> userService.getProfile("nobody", 1L));
    }

    @Test
    void getProfile_自分自身はfollowedByMeがfalse() {
        when(userMapper.findByUsername("taro")).thenReturn(Optional.of(user(1L, "taro")));

        UserProfileResponse res = userService.getProfile("taro", 1L);

        assertFalse(res.isFollowedByMe());
        Mockito.verify(followMapper, Mockito.never()).exists(Mockito.anyLong(), Mockito.anyLong());
    }

    @Test
    void getProfile_他人はfollowMapperの結果を反映する() {
        when(userMapper.findByUsername("bob")).thenReturn(Optional.of(user(2L, "bob")));
        when(followMapper.exists(1L, 2L)).thenReturn(true);
        when(followMapper.countByFollower(2L)).thenReturn(3);
        when(followMapper.countByFollowee(2L)).thenReturn(5);

        UserProfileResponse res = userService.getProfile("bob", 1L);

        assertTrue(res.isFollowedByMe());
        assertEquals(3, res.getFollowingCount());
        assertEquals(5, res.getFollowerCount());
    }

    @Test
    void updateBio_160文字超過は例外() {
        assertThrows(RuntimeException.class, () -> userService.updateBio(1L, "あ".repeat(161)));
    }

    @Test
    void updateBio_成功時は更新後のユーザー情報を返す() {
        when(userMapper.findById(1L)).thenReturn(Optional.of(user(1L, "taro")));

        UserSummaryResponse res = userService.updateBio(1L, "よろしく");

        Mockito.verify(userMapper).updateBio(1L, "よろしく");
        assertEquals("taro", res.getUsername());
    }

    @Test
    void search_空文字は空リストを返す() {
        List<UserSummaryResponse> result = userService.search(1L, "  ");

        assertTrue(result.isEmpty());
        Mockito.verifyNoInteractions(userMapper);
    }

    @Test
    void search_50文字超過は例外() {
        assertThrows(RuntimeException.class, () -> userService.search(1L, "あ".repeat(51)));
    }

    @Test
    void search_結果にフォロー状態を付与する() {
        when(userMapper.searchByKeyword(Mockito.anyString(), Mockito.eq(1L), Mockito.eq(20)))
                .thenReturn(List.of(user(2L, "bob")));
        when(followMapper.exists(1L, 2L)).thenReturn(true);

        List<UserSummaryResponse> result = userService.search(1L, "bo");

        assertEquals(1, result.size());
        assertTrue(result.get(0).isFollowedByMe());
    }
}
