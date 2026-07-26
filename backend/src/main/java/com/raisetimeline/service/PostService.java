package com.raisetimeline.service;

import com.raisetimeline.dto.PostRequest;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.model.Post;
import com.raisetimeline.model.PostWithAuthor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PostService {

    private static final int BODY_MAX_LENGTH = 280;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;

    private final PostMapper postMapper;

    public PostService(PostMapper postMapper) {
        this.postMapper = postMapper;
    }

    @Transactional(readOnly = true)
    public List<PostResponse> listPage(Long currentUserId, Long beforeId, Integer limit) {
        int clampedLimit = clampLimit(limit);
        return postMapper.findPage(beforeId, clampedLimit, currentUserId).stream()
                .map(p -> new PostResponse(p, p.getUserId().equals(currentUserId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> listNewerThan(Long currentUserId, Long afterId) {
        return postMapper.findNewerThan(afterId, currentUserId).stream()
                .map(p -> new PostResponse(p, p.getUserId().equals(currentUserId)))
                .toList();
    }

    private int clampLimit(Integer limit) {
        if (limit == null) return DEFAULT_PAGE_SIZE;
        return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
    }

    public PostResponse create(Long currentUserId, PostRequest req) {
        String body = validateBody(req.getBody());

        Post post = new Post();
        post.setUserId(currentUserId);
        post.setBody(body);
        LocalDateTime now = LocalDateTime.now();
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        postMapper.insert(post);

        PostWithAuthor saved = postMapper.findById(post.getId(), currentUserId)
                .orElseThrow(() -> new PostNotFoundException("投稿の作成に失敗しました"));
        return new PostResponse(saved, true);
    }

    public PostResponse update(Long currentUserId, Long postId, PostRequest req) {
        String body = validateBody(req.getBody());

        Post updated = postMapper.updateIfOwner(postId, currentUserId, body)
                .orElseGet(() -> { throw ownershipFailure(postId, "この投稿を編集する権限がありません"); });

        PostWithAuthor withAuthor = postMapper.findById(updated.getId(), currentUserId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        return new PostResponse(withAuthor, true);
    }

    public void delete(Long currentUserId, Long postId) {
        int deleted = postMapper.deleteIfOwner(postId, currentUserId);
        if (deleted == 0)
            throw ownershipFailure(postId, "この投稿を削除する権限がありません");
    }

    // update/deleteが対象を変更できなかった場合の原因を判定する。
    // 存在しない投稿なら404、他人の投稿なら403として区別する。
    private RuntimeException ownershipFailure(Long postId, String forbiddenMessage) {
        if (!postMapper.existsById(postId))
            return new PostNotFoundException("投稿が見つかりません");
        return new ForbiddenException(forbiddenMessage);
    }

    private String validateBody(String rawBody) {
        String body = rawBody == null ? null : rawBody.strip();
        if (body == null || body.isEmpty())
            throw new RuntimeException("投稿本文を入力してください");
        if (body.length() > BODY_MAX_LENGTH)
            throw new RuntimeException("投稿本文は280文字以内で入力してください");
        return body;
    }
}
