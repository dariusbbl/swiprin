package com.swiprin.service;

import com.swiprin.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final Path baseDir;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) {
        this.baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String storeCv(MultipartFile file, Long userId) {
        if (file.isEmpty()) throw new BadRequestException("File is empty");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Only PDF and Word documents are allowed");
        }

        String original  = file.getOriginalFilename();
        String extension = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".pdf";

        String filename = UUID.randomUUID() + extension;
        Path   dir      = baseDir.resolve("cv").resolve(String.valueOf(userId));

        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        return "/api/cv-drafts/files/" + userId + "/" + filename;
    }

    public Path resolveFile(Long userId, String filename) {
        // Prevent path traversal
        Path resolved = baseDir.resolve("cv").resolve(String.valueOf(userId))
                               .resolve(filename).normalize();
        if (!resolved.startsWith(baseDir)) {
            throw new BadRequestException("Invalid file path");
        }
        return resolved;
    }
}
