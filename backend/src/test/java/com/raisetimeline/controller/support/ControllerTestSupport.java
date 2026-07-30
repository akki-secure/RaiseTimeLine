package com.raisetimeline.controller.support;

import com.raisetimeline.controller.GlobalExceptionHandler;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** standaloneセットアップ+GlobalExceptionHandler登録という、全ControllerTest共通のMockMvc構築処理。 */
public final class ControllerTestSupport {

    private ControllerTestSupport() {}

    public static MockMvc mockMvcFor(Object controller) {
        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }
}
