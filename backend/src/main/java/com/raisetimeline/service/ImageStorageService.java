package com.raisetimeline.service;

import com.raisetimeline.exception.InvalidImageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/gif", "gif",
            "image/webp", "webp"
    );

    private static final Map<String, String> EXTENSION_ALIASES = Map.of(
            "jpg", "jpg",
            "jpeg", "jpg",
            "png", "png",
            "gif", "gif",
            "webp", "webp"
    );

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.upload.public-path}")
    private String publicPath;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new InvalidImageException("画像ファイルを選択してください");
        if (file.getSize() > MAX_SIZE_BYTES)
            throw new InvalidImageException("画像は5MB以下にしてください");

        String contentType = file.getContentType();
        String ext = contentType == null ? null : ALLOWED_CONTENT_TYPES.get(contentType);
        if (ext == null)
            throw new InvalidImageException("対応していない画像形式です（jpg/png/gif/webpのみ）");

        // Content-Typeはクライアントが自由に設定できる値のため、元ファイル名の拡張子とも
        // 整合していることを確認する二重チェック（形式偽装対策）。
        String originalExt = extractExtension(file.getOriginalFilename());
        if (originalExt == null || !ext.equals(EXTENSION_ALIASES.get(originalExt)))
            throw new InvalidImageException("ファイル拡張子と形式が一致しません");

        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            // 保存ファイル名はUUIDで生成し、ユーザー入力(originalFilename)を一切パス組み立てに
            // 使わないことでパストラバーサル（例: "../../etc/passwd"）を構造的に排除する。
            String filename = UUID.randomUUID() + "." + ext;
            Path target = dir.resolve(filename).normalize();

            // UUID生成のため理論上到達しないが、意図を明示するための多層防御チェック。
            if (!target.getParent().equals(dir))
                throw new InvalidImageException("不正なファイル名です");

            file.transferTo(target.toFile());
            return publicPath + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("画像の保存に失敗しました", e);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null) return null;
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) return null;
        return filename.substring(dotIndex + 1).toLowerCase();
    }
}
