package com.raisetimeline.controller;

import com.raisetimeline.controller.support.ControllerTestSupport;
import com.raisetimeline.dto.AuthResponse;
import com.raisetimeline.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = Mockito.mock(AuthService.class);
        mockMvc = ControllerTestSupport.mockMvcFor(new AuthController(authService));
    }

    private AuthResponse authResponse() {
        return new AuthResponse("access-token", "refresh-token", 1L, "taro", "太郎", "taro@example.com");
    }

    @Test
    void register_正常系は200でトークンを返す() throws Exception {
        when(authService.register(any())).thenReturn(authResponse());

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("{\"email\":\"taro@example.com\",\"password\":\"password123\",\"username\":\"taro\",\"displayName\":\"太郎\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-token"));
    }

    @Test
    void register_バリデーションエラーは400を返す() throws Exception {
        when(authService.register(any())).thenThrow(new RuntimeException("メールアドレスの形式が正しくありません"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("{\"email\":\"invalid\",\"password\":\"password123\",\"username\":\"taro\",\"displayName\":\"太郎\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("メールアドレスの形式が正しくありません"));
    }

    @Test
    void login_正常系は200でトークンを返す() throws Exception {
        when(authService.login(any())).thenReturn(authResponse());

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"taro@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("taro"));
    }

    @Test
    void login_失敗時は400を返す() throws Exception {
        when(authService.login(any())).thenThrow(new RuntimeException("メールアドレスまたはパスワードが正しくありません"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"taro@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_正常系は200で新しいトークンを返す() throws Exception {
        when(authService.refresh(any())).thenReturn(authResponse());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"raw-refresh-token\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_無効なトークンは400を返す() throws Exception {
        when(authService.refresh(any())).thenThrow(new RuntimeException("リフレッシュトークンが無効です"));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"invalid\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logout_成功時は204を返す() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"raw-refresh-token\"}"))
                .andExpect(status().isNoContent());

        Mockito.verify(authService).logout(any());
    }
}
