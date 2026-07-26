package com.raisetimeline.service;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.mapper.FollowMapper;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FollowService {

    private static final int LIST_LIMIT = 100;
    private static final int DEFAULT_SUGGESTION_LIMIT = 5;
    private static final int MAX_SUGGESTION_LIMIT = 20;

    private final FollowMapper followMapper;
    private final UserMapper userMapper;

    public FollowService(FollowMapper followMapper, UserMapper userMapper) {
        this.followMapper = followMapper;
        this.userMapper = userMapper;
    }

    // まずdeleteを試み、対象がなければ（未フォロー状態）insertする。
    // UNIQUE制約+ON CONFLICT DO NOTHINGにより二重クリックでも例外化されない。
    public FollowResponse toggle(Long currentUserId, String targetUsername) {
        User target = findByUsername(targetUsername);
        if (target.getId().equals(currentUserId))
            throw new RuntimeException("自分自身をフォローすることはできません");

        int deleted = followMapper.delete(currentUserId, target.getId());
        boolean followed;
        if (deleted > 0) {
            followed = false;
        } else {
            followMapper.insertIfAbsent(currentUserId, target.getId());
            followed = true;
        }
        int followerCount = followMapper.countByFollowee(target.getId());
        return new FollowResponse(followed, followerCount);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listFollowing(Long currentUserId, String username) {
        User target = findByUsername(username);
        return followMapper.findFollowing(target.getId(), LIST_LIMIT).stream()
                .map(u -> toSummary(u, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listFollowers(Long currentUserId, String username) {
        User target = findByUsername(username);
        return followMapper.findFollowers(target.getId(), LIST_LIMIT).stream()
                .map(u -> toSummary(u, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> suggestions(Long currentUserId, Integer limit) {
        int clampedLimit = clampSuggestionLimit(limit);
        return followMapper.findSuggestions(currentUserId, clampedLimit).stream()
                .map(u -> new UserSummaryResponse(u, false))
                .toList();
    }

    private int clampSuggestionLimit(Integer limit) {
        if (limit == null) return DEFAULT_SUGGESTION_LIMIT;
        return Math.max(1, Math.min(limit, MAX_SUGGESTION_LIMIT));
    }

    private User findByUsername(String username) {
        return userMapper.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
    }

    private UserSummaryResponse toSummary(User user, Long currentUserId) {
        return new UserSummaryResponse(user, followMapper.exists(currentUserId, user.getId()));
    }
}
