package com.raisetimeline.service;

import com.raisetimeline.dto.UserSummaryResponse;
import com.raisetimeline.exception.UserNotFoundException;
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

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public UserSummaryResponse getProfile(String username) {
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        return new UserSummaryResponse(user);
    }

    @Transactional
    public UserSummaryResponse updateBio(Long userId, String rawBio) {
        String bio = rawBio == null ? "" : rawBio.strip();
        if (bio.length() > BIO_MAX_LENGTH)
            throw new RuntimeException("自己紹介は160文字以内で入力してください");

        userMapper.updateBio(userId, bio);
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        return new UserSummaryResponse(user);
    }

    public List<UserSummaryResponse> search(Long currentUserId, String q) {
        String keyword = q == null ? "" : q.strip();
        if (keyword.isEmpty()) return List.of();
        if (keyword.length() > MAX_KEYWORD_LENGTH)
            throw new RuntimeException("検索キーワードは50文字以内で入力してください");

        String pattern = "%" + escapeLikePattern(keyword) + "%";
        return userMapper.searchByKeyword(pattern, currentUserId, SEARCH_LIMIT).stream()
                .map(UserSummaryResponse::new)
                .toList();
    }

    // ILIKEのワイルドカード文字(%, _)をエスケープし、ユーザー入力をそのまま検索パターンに使わない。
    // ESCAPE '\' と対応させるため、エスケープ文字自体(\)も先にエスケープする。
    private String escapeLikePattern(String raw) {
        return raw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
