package com.raisetimeline.service;

import com.raisetimeline.exception.InvalidImageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ImageStorageServiceTest {

    private S3Client s3Client;
    private ImageStorageService imageStorageService;

    @BeforeEach
    void setUp() {
        s3Client = Mockito.mock(S3Client.class);
        imageStorageService = new ImageStorageService(s3Client);
        ReflectionTestUtils.setField(imageStorageService, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(imageStorageService, "region", "ap-northeast-1");
    }

    @Test
    void store_空ファイルは例外() {
        MockMultipartFile empty = new MockMultipartFile("image", "test.jpg", "image/jpeg", new byte[0]);
        assertThrows(InvalidImageException.class, () -> imageStorageService.store(empty));
    }

    @Test
    void store_5MB超過は例外() {
        byte[] tooLarge = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile("image", "test.jpg", "image/jpeg", tooLarge);
        assertThrows(InvalidImageException.class, () -> imageStorageService.store(file));
    }

    @Test
    void store_対応していない形式は例外() {
        MockMultipartFile file = new MockMultipartFile("image", "test.txt", "text/plain", "dummy".getBytes());
        assertThrows(InvalidImageException.class, () -> imageStorageService.store(file));
    }

    @Test
    void store_拡張子とContentTypeが不一致なら例外() {
        MockMultipartFile file = new MockMultipartFile("image", "test.png", "image/jpeg", "dummy".getBytes());
        assertThrows(InvalidImageException.class, () -> imageStorageService.store(file));
    }

    @Test
    void store_正常系はS3にputObjectしURLを返す() {
        MockMultipartFile file = new MockMultipartFile("image", "test.jpg", "image/jpeg", "dummy".getBytes());
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String url = imageStorageService.store(file);

        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        Mockito.verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));

        PutObjectRequest capturedRequest = requestCaptor.getValue();
        assertTrue(capturedRequest.bucket().equals("test-bucket"));
        assertTrue(capturedRequest.key().endsWith(".jpg"));
        assertTrue(url.startsWith("https://test-bucket.s3.ap-northeast-1.amazonaws.com/"));
        assertTrue(url.endsWith(".jpg"));
    }
}
