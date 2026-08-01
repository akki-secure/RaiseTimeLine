package com.raisetimeline.service;

import com.raisetimeline.dto.CommentRequest;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.exception.CommentNotFoundException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.exception.ValidationException;
import com.raisetimeline.mapper.CommentMapper;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.model.Comment;
import com.raisetimeline.model.CommentWithAuthor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CommentService {

    private static final int BODY_MAX_LENGTH = 280;

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;

    public CommentService(CommentMapper commentMapper, PostMapper postMapper) {
        this.commentMapper = commentMapper;
        this.postMapper = postMapper;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listByPost(Long currentUserId, Long postId) {
        if (!postMapper.existsById(postId))
            throw new PostNotFoundException("投稿が見つかりません");

        return commentMapper.findByPostId(postId).stream()
                .map(c -> new CommentResponse(c, c.getUserId().equals(currentUserId)))
                .toList();
    }

    public CommentResponse create(Long currentUserId, Long postId, CommentRequest req) {
        if (!postMapper.existsById(postId))
            throw new PostNotFoundException("投稿が見つかりません");

        String body = validateBody(req.getBody());

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(currentUserId);
        comment.setBody(body);
        LocalDateTime now = LocalDateTime.now();
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        commentMapper.insert(comment);

        CommentWithAuthor saved = commentMapper.findById(comment.getId())
                .orElseThrow(() -> new CommentNotFoundException("コメントの作成に失敗しました"));
        return new CommentResponse(saved, true);
    }

    public CommentResponse update(Long currentUserId, Long postId, Long commentId, CommentRequest req) {
        String body = validateBody(req.getBody());

        Comment updated = commentMapper.updateIfOwner(commentId, postId, currentUserId, body)
                .orElseGet(() -> { throw ownershipFailure(postId, commentId, "このコメントを編集する権限がありません"); });

        CommentWithAuthor withAuthor = commentMapper.findById(updated.getId())
                .orElseThrow(() -> new CommentNotFoundException("コメントが見つかりません"));
        return new CommentResponse(withAuthor, true);
    }

    public void delete(Long currentUserId, Long postId, Long commentId) {
        int deleted = commentMapper.deleteIfOwner(commentId, postId, currentUserId);
        if (deleted == 0)
            throw ownershipFailure(postId, commentId, "このコメントを削除する権限がありません");
    }

    private RuntimeException ownershipFailure(Long postId, Long commentId, String forbiddenMessage) {
        if (!commentMapper.existsByIdAndPostId(commentId, postId))
            return new CommentNotFoundException("コメントが見つかりません");
        return new ForbiddenException(forbiddenMessage);
    }

    private String validateBody(String rawBody) {
        String body = rawBody == null ? null : rawBody.strip();
        if (body == null || body.isEmpty())
            throw new ValidationException("コメント本文を入力してください");
        if (body.length() > BODY_MAX_LENGTH)
            throw new ValidationException("コメントは280文字以内で入力してください");
        return body;
    }
}
