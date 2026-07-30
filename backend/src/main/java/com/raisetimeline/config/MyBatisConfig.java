package com.raisetimeline.config;

import org.apache.ibatis.mapping.DatabaseIdProvider;
import org.apache.ibatis.mapping.VendorDatabaseIdProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

/**
 * 本番(PostgreSQL)とテスト(H2)でSQLが異なるMapper文を{@code databaseId}属性で切り替えるためのプロバイダ。
 * ほとんどの文はdatabaseId未指定のままpostgresql/h2どちらでも動くため、
 * 非互換が判明した文だけXML側にdatabaseId="h2"版を追加する。
 */
@Configuration
public class MyBatisConfig {

    @Bean
    public DatabaseIdProvider databaseIdProvider() {
        VendorDatabaseIdProvider provider = new VendorDatabaseIdProvider();
        Properties properties = new Properties();
        properties.setProperty("PostgreSQL", "postgresql");
        properties.setProperty("H2", "h2");
        provider.setProperties(properties);
        return provider;
    }
}
