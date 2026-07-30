package com.raisetimeline.controller;

import com.raisetimeline.controller.support.ControllerTestSupport;
import com.raisetimeline.controller.support.CurrentUserTestSupport;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.dto.UserProfileResponse;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.model.PostWithAuthor;
import com.raisetimeline.model.User;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerTest {

    private UserService userService;
    private PostService postService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        userService = Mockito.mock(UserService.class);
        postService = Mockito.mock(PostService.class);
        mockMvc = ControllerTestSupport.mockMvcFor(new UserController(userService, postService));
        CurrentUserTestSupport.loginAs(1L);
    }

    @AfterEach
    void tearDown() {
        CurrentUserTestSupport.logout();
    }

    private UserProfileResponse profile(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setDisplayName("表示名");
        return new UserProfileResponse(u, false, 0, 0);
    }

    @Test
    void search_正常系は200で一覧を返す() throws Exception {
        User u = new User();
        u.setId(2L);
        u.setUsername("bob");
        u.setDisplayName("Bob");
        when(userService.search(1L, "bo")).thenReturn(List.of(new UserSummaryResponse(u, false)));

        mockMvc.perform(get("/api/users/search").param("q", "bo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("bob"));
    }

    @Test
    void getProfile_正常系は200でプロフィールを返す() throws Exception {
        when(userService.getProfile("bob", 1L)).thenReturn(profile(2L, "bob"));

        mockMvc.perform(get("/api/users/bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"));
    }

    @Test
    void getProfile_存在しないユーザーは404を返す() throws Exception {
        when(userService.getProfile("nobody", 1L)).thenThrow(new UserNotFoundException("ユーザーが見つかりません"));

        mockMvc.perform(get("/api/users/nobody"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPosts_プロフィール取得後に該当ユーザーの投稿一覧を返す() throws Exception {
        when(userService.getProfile("bob", 1L)).thenReturn(profile(2L, "bob"));
        PostWithAuthor p = new PostWithAuthor();
        p.setId(10L);
        p.setUserId(2L);
        p.setBody("投稿本文");
        p.setCreatedAt(java.time.LocalDateTime.now());
        p.setUpdatedAt(java.time.LocalDateTime.now());
        p.setAuthorUsername("bob");
        p.setAuthorDisplayName("Bob");
        when(postService.listPageByUserId(1L, 2L, null, null))
                .thenReturn(List.of(new PostResponse(p, false)));

        mockMvc.perform(get("/api/users/bob/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].body").value("投稿本文"));
    }

    @Test
    void updateMyBio_正常系は200で更新後のユーザー情報を返す() throws Exception {
        User u = new User();
        u.setId(1L);
        u.setUsername("taro");
        u.setDisplayName("太郎");
        u.setBio("よろしく");
        when(userService.updateBio(1L, "よろしく")).thenReturn(new UserSummaryResponse(u, false));

        mockMvc.perform(put("/api/users/me")
                        .contentType("application/json")
                        .content("{\"bio\":\"よろしく\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("よろしく"));
    }

    @Test
    void updateMyBio_文字数超過は400を返す() throws Exception {
        when(userService.updateBio(1L, "あ".repeat(161)))
                .thenThrow(new RuntimeException("自己紹介は160文字以内で入力してください"));

        mockMvc.perform(put("/api/users/me")
                        .contentType("application/json")
                        .content("{\"bio\":\"" + "あ".repeat(161) + "\"}"))
                .andExpect(status().isBadRequest());
    }
}
