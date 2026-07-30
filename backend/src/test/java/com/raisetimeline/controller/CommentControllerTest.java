package com.raisetimeline.controller;

import com.raisetimeline.controller.support.ControllerTestSupport;
import com.raisetimeline.controller.support.CurrentUserTestSupport;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.exception.CommentNotFoundException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.model.CommentWithAuthor;
import com.raisetimeline.service.CommentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CommentControllerTest {

    private CommentService commentService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        commentService = Mockito.mock(CommentService.class);
        mockMvc = ControllerTestSupport.mockMvcFor(new CommentController(commentService));
        CurrentUserTestSupport.loginAs(1L);
    }

    @AfterEach
    void tearDown() {
        CurrentUserTestSupport.logout();
    }

    private CommentResponse response(Long id, String body) {
        CommentWithAuthor c = new CommentWithAuthor();
        c.setId(id);
        c.setPostId(5L);
        c.setUserId(1L);
        c.setBody(body);
        LocalDateTime now = LocalDateTime.now();
        c.setCreatedAt(now);
        c.setUpdatedAt(now);
        c.setAuthorUsername("taro");
        c.setAuthorDisplayName("太郎");
        return new CommentResponse(c, true);
    }

    @Test
    void list_存在しない投稿は404を返す() throws Exception {
        when(commentService.listByPost(1L, 999L)).thenThrow(new PostNotFoundException("投稿が見つかりません"));

        mockMvc.perform(get("/api/posts/999/comments"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_正常系は200でコメントを返す() throws Exception {
        when(commentService.create(eq(1L), eq(5L), any())).thenReturn(response(1L, "コメント本文"));

        mockMvc.perform(post("/api/posts/5/comments")
                        .contentType("application/json")
                        .content("{\"body\":\"コメント本文\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("コメント本文"));
    }

    @Test
    void update_他人のコメントは403を返す() throws Exception {
        when(commentService.update(eq(1L), eq(5L), eq(2L), any()))
                .thenThrow(new ForbiddenException("このコメントを編集する権限がありません"));

        mockMvc.perform(put("/api/posts/5/comments/2")
                        .contentType("application/json")
                        .content("{\"body\":\"改ざん\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void update_存在しないコメントは404を返す() throws Exception {
        when(commentService.update(eq(1L), eq(5L), eq(999L), any()))
                .thenThrow(new CommentNotFoundException("コメントが見つかりません"));

        mockMvc.perform(put("/api/posts/5/comments/999")
                        .contentType("application/json")
                        .content("{\"body\":\"編集\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_成功時は204を返す() throws Exception {
        mockMvc.perform(delete("/api/posts/5/comments/1"))
                .andExpect(status().isNoContent());

        Mockito.verify(commentService).delete(1L, 5L, 1L);
    }
}
