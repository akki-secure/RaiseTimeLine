package com.raisetimeline.controller;

import com.raisetimeline.controller.support.ControllerTestSupport;
import com.raisetimeline.controller.support.CurrentUserTestSupport;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.model.PostWithAuthor;
import com.raisetimeline.service.PostService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PostControllerTest {

    private PostService postService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        postService = Mockito.mock(PostService.class);
        mockMvc = ControllerTestSupport.mockMvcFor(new PostController(postService));
        CurrentUserTestSupport.loginAs(1L);
    }

    @AfterEach
    void tearDown() {
        CurrentUserTestSupport.logout();
    }

    private PostResponse response(Long id, String body) {
        PostWithAuthor p = new PostWithAuthor();
        p.setId(id);
        p.setUserId(1L);
        p.setBody(body);
        LocalDateTime now = LocalDateTime.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        p.setAuthorUsername("taro");
        p.setAuthorDisplayName("太郎");
        return new PostResponse(p, true);
    }

    @Test
    void list_正常系は200で一覧を返す() throws Exception {
        when(postService.listPage(1L, null, null)).thenReturn(List.of(response(1L, "投稿1")));

        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].body").value("投稿1"));
    }

    @Test
    void list_afterId指定時はlistNewerThanが呼ばれる() throws Exception {
        when(postService.listNewerThan(1L, 10L)).thenReturn(List.of());

        mockMvc.perform(get("/api/posts").param("afterId", "10"))
                .andExpect(status().isOk());

        Mockito.verify(postService).listNewerThan(1L, 10L);
    }

    @Test
    void create_multipartで投稿作成し200を返す() throws Exception {
        MockMultipartFile image = new MockMultipartFile("image", "photo.png", "image/png", new byte[] {1, 2, 3});
        when(postService.create(eq(1L), eq("こんにちは"), any())).thenReturn(response(5L, "こんにちは"));

        mockMvc.perform(multipart("/api/posts").file(image).param("body", "こんにちは"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("こんにちは"));
    }

    @Test
    void update_他人の投稿は403を返す() throws Exception {
        when(postService.update(eq(1L), eq(5L), any())).thenThrow(new ForbiddenException("この投稿を編集する権限がありません"));

        mockMvc.perform(put("/api/posts/5")
                        .contentType("application/json")
                        .content("{\"body\":\"改ざん\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("この投稿を編集する権限がありません"));
    }

    @Test
    void update_存在しない投稿は404を返す() throws Exception {
        when(postService.update(eq(1L), eq(999L), any())).thenThrow(new PostNotFoundException("投稿が見つかりません"));

        mockMvc.perform(put("/api/posts/999")
                        .contentType("application/json")
                        .content("{\"body\":\"編集\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_成功時は204を返す() throws Exception {
        mockMvc.perform(delete("/api/posts/5"))
                .andExpect(status().isNoContent());

        Mockito.verify(postService).delete(1L, 5L);
    }
}
