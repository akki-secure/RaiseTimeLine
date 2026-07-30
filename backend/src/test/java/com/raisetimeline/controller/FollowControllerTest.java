package com.raisetimeline.controller;

import com.raisetimeline.controller.support.ControllerTestSupport;
import com.raisetimeline.controller.support.CurrentUserTestSupport;
import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.model.User;
import com.raisetimeline.service.FollowService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FollowControllerTest {

    private FollowService followService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        followService = Mockito.mock(FollowService.class);
        mockMvc = ControllerTestSupport.mockMvcFor(new FollowController(followService));
        CurrentUserTestSupport.loginAs(1L);
    }

    @AfterEach
    void tearDown() {
        CurrentUserTestSupport.logout();
    }

    private UserSummaryResponse summary(String username) {
        User u = new User();
        u.setId(2L);
        u.setUsername(username);
        u.setDisplayName("表示名");
        return new UserSummaryResponse(u, false);
    }

    @Test
    void toggle_正常系はfollowedとfollowerCountを返す() throws Exception {
        when(followService.toggle(1L, "bob")).thenReturn(new FollowResponse(true, 3));

        mockMvc.perform(post("/api/users/bob/follow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followed").value(true))
                .andExpect(jsonPath("$.followerCount").value(3));
    }

    @Test
    void toggle_存在しないユーザーは404を返す() throws Exception {
        when(followService.toggle(1L, "nobody")).thenThrow(new UserNotFoundException("ユーザーが見つかりません"));

        mockMvc.perform(post("/api/users/nobody/follow"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getFollowing_一覧を返す() throws Exception {
        when(followService.listFollowing(1L, "bob")).thenReturn(List.of(summary("carol")));

        mockMvc.perform(get("/api/users/bob/following"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("carol"));
    }

    @Test
    void getFollowers_一覧を返す() throws Exception {
        when(followService.listFollowers(1L, "bob")).thenReturn(List.of(summary("dave")));

        mockMvc.perform(get("/api/users/bob/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("dave"));
    }

    @Test
    void getSuggestions_limit未指定でも200を返す() throws Exception {
        when(followService.suggestions(1L, null)).thenReturn(List.of(summary("eve")));

        mockMvc.perform(get("/api/users/suggestions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("eve"));
    }
}
