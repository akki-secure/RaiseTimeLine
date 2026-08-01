package com.raisetimeline.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        MDC.put("requestId", UUID.randomUUID().toString());
        long startNanos = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Long userId) {
                MDC.put("userId", String.valueOf(userId));
            }

            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            int status = response.getStatus();

            Object[] args = {
                    kv("method", request.getMethod()),
                    kv("path", request.getRequestURI()),
                    kv("status", status),
                    kv("durationMs", durationMs)
            };

            if (status >= 500) {
                log.error("http_request", args);
            } else if (status >= 400) {
                log.warn("http_request", args);
            } else {
                log.info("http_request", args);
            }

            MDC.clear();
        }
    }
}
