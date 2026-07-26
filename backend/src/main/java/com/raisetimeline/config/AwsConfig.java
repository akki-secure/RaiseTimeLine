package com.raisetimeline.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsConfig {

    @Value("${app.s3.region}")
    private String region;

    // 認証情報はデフォルトクレデンシャルチェーン（~/.aws/credentials、環境変数、IAMロール等）から
    // 自動取得する。アクセスキーをコードや設定ファイルに直接書かない。
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .build();
    }
}
