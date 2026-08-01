package com.raisetimeline.service;

import com.raisetimeline.dto.UserProfileResponse;
import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.exception.UserNotFoundException;
import com.raisetimeline.exception.ValidationException;
import com.raisetimeline.mapper.FollowMapper;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private static final int MAX_KEYWORD_LENGTH = 50;
    private static final int SEARCH_LIMIT = 20;
    private static final int BIO_MAX_LENGTH = 160;

    private final UserMapper userMapper;
    private final FollowMapper followMapper;

    public UserService(UserMapper userMapper, FollowMapper followMapper) {
        this.userMapper = userMapper;
        this.followMapper = followMapper;
    }

    public UserProfileResponse getProfile(String username, Long currentUserId) {
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        boolean followedByMe = !user.getId().equals(currentUserId)
                && followMapper.exists(currentUserId, user.getId());
        int followingCount = followMapper.countByFollower(user.getId());
        int followerCount = followMapper.countByFollowee(user.getId());
        return new UserProfileResponse(user, followedByMe, followingCount, followerCount);
    }

    @Transactional
    public UserSummaryResponse updateBio(Long userId, String rawBio) {
        String bio = rawBio == null ? "" : rawBio.strip();
        if (bio.length() > BIO_MAX_LENGTH)
            throw new ValidationException("自己紹介は160文字以内で入力してください");

        userMapper.updateBio(userId, bio);
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        return new UserSummaryResponse(user, false);
    }

    public List<UserSummaryResponse> search(Long currentUserId, String q) {
        String keyword = q == null ? "" : q.strip();
        if (keyword.isEmpty()) return List.of();
        if (keyword.length() > MAX_KEYWORD_LENGTH)
            throw new ValidationException("検索キーワードは50文字以内で入力してください");

        String pattern = "%" + escapeLikePattern(keyword) + "%";
        return userMapper.searchByKeyword(pattern, currentUserId, SEARCH_LIMIT).stream()
                .map(u -> new UserSummaryResponse(u, followMapper.exists(currentUserId, u.getId())))
                .toList();
    }

    // ILIKEのワイルドカード文字(%, _)をエスケープし、ユーザー入力をそのまま検索パターンに使わない。
    // ESCAPE '\' と対応させるため、エスケープ文字自体(\)も先にエスケープする。
    private String escapeLikePattern(String raw) {
        return raw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
