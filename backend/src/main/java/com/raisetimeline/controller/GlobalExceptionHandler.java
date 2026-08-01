package com.raisetimeline.controller;

import com.raisetimeline.exception.CommentNotFoundException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.InvalidImageException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.exception.ValidationException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

import static net.logstash.logback.argument.StructuredArguments.kv;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(PostNotFoundException ex, HttpServletRequest request) {
        log.warn("post_not_found", kv("path", request.getRequestURI()), kv("message", ex.getMessage()));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidImageException.class)
    public ResponseEntity<Map<String, String>> handleInvalidImage(InvalidImageException ex, HttpServletRequest request) {
        log.warn("invalid_image", kv("path", request.getRequestURI()), kv("message", ex.getMessage()));
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("max_upload_size_exceeded", kv("path", request.getRequestURI()));
        return ResponseEntity.badRequest().body(Map.of("message", "画像は5MB以下にしてください"));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(UserNotFoundException ex, HttpServletRequest request) {
        log.warn("user_not_found", kv("path", request.getRequestURI()), kv("message", ex.getMessage()));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleCommentNotFound(CommentNotFoundException ex, HttpServletRequest request) {
        log.warn("comment_not_found", kv("path", request.getRequestURI()), kv("message", ex.getMessage()));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(ForbiddenException ex, HttpServletRequest request) {
        log.warn("forbidden", kv("path", request.getRequestURI()), kv("message", ex.getMessage()));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, String>> handleValidation(ValidationException ex, HttpServletRequest request) {
        log.warn("validation_failed", kv("path", request.getRequestURI()), kv("message", ex.getMessage()));
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        log.error("unhandled_exception", kv("path", request.getRequestURI()), kv("exceptionType", ex.getClass().getSimpleName()), ex);
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
