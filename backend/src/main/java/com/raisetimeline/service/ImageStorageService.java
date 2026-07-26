package com.raisetimeline.service;

import com.raisetimeline.exception.InvalidImageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
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

    private final S3Client s3Client;

    @Value("${app.s3.bucket-name}")
    private String bucketName;

    @Value("${app.s3.region}")
    private String region;

    public ImageStorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

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

        // オブジェクトキーはUUIDで生成し、ユーザー入力(originalFilename)を一切キー組み立てに
        // 使わないことでパストラバーサル・キー衝突を構造的に排除する。
        String key = UUID.randomUUID() + "." + ext;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
        } catch (IOException | S3Exception e) {
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
