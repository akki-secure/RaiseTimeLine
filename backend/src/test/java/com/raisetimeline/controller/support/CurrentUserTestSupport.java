package com.raisetimeline.controller.support;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/**
 * CurrentUser.id()が参照するSecurityContextHolderに、standaloneセットアップのMockMvcテストから
 * 直接ログイン状態をセットするためのヘルパー。CurrentUser自体はモックせず本物のコードパスを通す。
 */
public final class CurrentUserTestSupport {

    private CurrentUserTestSupport() {}

    public static void loginAs(Long userId) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
    }

    public static void logout() {
        SecurityContextHolder.clearContext();
    }
}
