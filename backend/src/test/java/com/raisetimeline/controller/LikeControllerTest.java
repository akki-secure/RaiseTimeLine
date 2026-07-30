package com.raisetimeline.controller;

import com.raisetimeline.controller.support.ControllerTestSupport;
import com.raisetimeline.controller.support.CurrentUserTestSupport;
import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.service.LikeService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class LikeControllerTest {

    private LikeService likeService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        likeService = Mockito.mock(LikeService.class);
        mockMvc = ControllerTestSupport.mockMvcFor(new LikeController(likeService));
        CurrentUserTestSupport.loginAs(1L);
    }

    @AfterEach
    void tearDown() {
        CurrentUserTestSupport.logout();
    }

    @Test
    void toggle_正常系はlikedとlikeCountを返す() throws Exception {
        when(likeService.toggle(1L, 5L)).thenReturn(new LikeResponse(true, 4));

        mockMvc.perform(post("/api/posts/5/likes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(4));
    }

    @Test
    void toggle_存在しない投稿は404を返す() throws Exception {
        when(likeService.toggle(1L, 999L)).thenThrow(new PostNotFoundException("投稿が見つかりません"));

        mockMvc.perform(post("/api/posts/999/likes"))
                .andExpect(status().isNotFound());
    }
}
