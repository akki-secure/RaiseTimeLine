package com.raisetimeline.service;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.exception.PostNotFoundException;
import com.raisetimeline.mapper.LikeMapper;
import com.raisetimeline.mapper.PostMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LikeService {

    private final LikeMapper likeMapper;
    private final PostMapper postMapper;

    public LikeService(LikeMapper likeMapper, PostMapper postMapper) {
        this.likeMapper = likeMapper;
        this.postMapper = postMapper;
    }

    // まずdeleteを試み、対象がなければ（未いいね状態）insertする。
    // UNIQUE制約+ON CONFLICT DO NOTHINGにより二重クリックでも例外化されない。
    public LikeResponse toggle(Long currentUserId, Long postId) {
        if (!postMapper.existsById(postId))
            throw new PostNotFoundException("投稿が見つかりません");

        int deleted = likeMapper.delete(postId, currentUserId);
        boolean liked;
        if (deleted > 0) {
            liked = false;
        } else {
            likeMapper.insertIfAbsent(postId, currentUserId);
            liked = true;
        }
        int count = likeMapper.countByPost(postId);
        return new LikeResponse(liked, count);
    }
}
