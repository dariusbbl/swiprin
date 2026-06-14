package com.swiprin.service;

import com.swiprin.dto.request.CreateCvDraftRequest;
import com.swiprin.dto.response.CvDraftResponse;
import com.swiprin.exception.BadRequestException;
import com.swiprin.exception.ForbiddenException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.CvDraft;
import com.swiprin.model.User;
import com.swiprin.repository.CvDraftRepository;
import com.swiprin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CvDraftService {

    private final CvDraftRepository cvDraftRepository;
    private final UserRepository userRepository;
    private final PdfExtractionService pdfExtractionService;
    private final FileStorageService fileStorageService;

    public List<CvDraftResponse> getAllForUser(Long userId) {
        return cvDraftRepository.findAllByUserIdAndDeletedFalse(userId)
                .stream().map(this::toResponse).toList();
    }

    public CvDraftResponse getById(Long id, Long userId) {
        CvDraft draft = findOwnedOrThrow(id, userId);
        if (Boolean.TRUE.equals(draft.getDeleted())) {
            throw new ResourceNotFoundException("CV draft not found: " + id);
        }
        return toResponse(draft);
    }

    @Transactional
    public CvDraftResponse create(CreateCvDraftRequest req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(req.getIsDefault())) {
            cvDraftRepository.clearDefaultForUser(userId);
        }

        String fileUrl = req.getFileUrl() != null ? req.getFileUrl().trim() : null;

        CvDraft draft = CvDraft.builder()
                .user(user)
                .name(req.getName().trim())
                .fileUrl(fileUrl)
                .isDefault(Boolean.TRUE.equals(req.getIsDefault()))
                .deleted(false)
                .build();

        extractAndStore(draft, fileUrl);
        return toResponse(cvDraftRepository.save(draft));
    }

    @Transactional
    public CvDraftResponse update(Long id, CreateCvDraftRequest req, Long userId) {
        CvDraft draft = findOwnedOrThrow(id, userId);

        if (req.getName() != null) draft.setName(req.getName().trim());

        if (req.getFileUrl() != null) {
            String newUrl = req.getFileUrl().isBlank() ? null : req.getFileUrl().trim();
            if (!java.util.Objects.equals(newUrl, draft.getFileUrl())) {
                draft.setFileUrl(newUrl);
                extractAndStore(draft, newUrl);
            }
        }

        if (Boolean.TRUE.equals(req.getIsDefault()) && !Boolean.TRUE.equals(draft.getIsDefault())) {
            cvDraftRepository.clearDefaultForUser(userId);
            draft.setIsDefault(true);
        }

        return toResponse(cvDraftRepository.save(draft));
    }

    @Transactional
    public CvDraftResponse setFileUrl(Long id, String fileUrl, Long userId) {
        CvDraft draft = findOwnedOrThrow(id, userId);
        draft.setFileUrl(fileUrl);
        extractAndStore(draft, fileUrl);
        return toResponse(cvDraftRepository.save(draft));
    }

    @Transactional
    public CvDraftResponse setDefault(Long id, Long userId) {
        CvDraft draft = findOwnedOrThrow(id, userId);
        if (Boolean.TRUE.equals(draft.getDeleted())) {
            throw new BadRequestException("Cannot set a deleted CV as default");
        }
        cvDraftRepository.clearDefaultForUser(userId);
        draft.setIsDefault(true);
        return toResponse(cvDraftRepository.save(draft));
    }

    // Soft delete — keeps reference intact in existing applications
    @Transactional
    public void delete(Long id, Long userId) {
        CvDraft draft = findOwnedOrThrow(id, userId);
        if (Boolean.TRUE.equals(draft.getIsDefault())) {
            throw new BadRequestException("Cannot delete your default CV. Set another CV as default first.");
        }
        draft.setDeleted(true);
        cvDraftRepository.save(draft);
    }

    @Transactional
    public int reextractAll() {
        List<CvDraft> pending = cvDraftRepository.findAllByFileUrlIsNotNullAndExtractedTextIsNull();
        int processed = 0;
        for (CvDraft draft : pending) {
            extractAndStore(draft, draft.getFileUrl());
            cvDraftRepository.save(draft);
            processed++;
        }
        log.info("Re-extracted PDF text for {} CV drafts", processed);
        return processed;
    }

    // Parses /api/cv-drafts/files/{userId}/{filename}, resolves the file path,
    // and populates extractedText + experienceYears on the draft.
    // Only PDFs are processed; failures are non-fatal.
    private void extractAndStore(CvDraft draft, String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        if (!fileUrl.toLowerCase().endsWith(".pdf")) return;
        try {
            String[] parts = fileUrl.split("/");
            Long fileUserId = Long.parseLong(parts[parts.length - 2]);
            String filename  = parts[parts.length - 1];

            java.nio.file.Path filePath = fileStorageService.resolveFile(fileUserId, filename);
            long __benchStart = System.nanoTime();
            String text = pdfExtractionService.extractText(filePath);
            draft.setExtractedText(text);
            draft.setExperienceYears(pdfExtractionService.extractExperienceYears(text));
            log.info("[BENCH] PDF text+experience extraction took {} ms",
                    (System.nanoTime() - __benchStart) / 1_000_000.0);
        } catch (Exception e) {
            log.warn("CV extraction skipped for '{}': {}", draft.getName(), e.getMessage());
        }
    }

    private CvDraft findOwnedOrThrow(Long id, Long userId) {
        return cvDraftRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("CV draft not found: " + id));
    }

    public CvDraftResponse toResponse(CvDraft draft) {
        return CvDraftResponse.builder()
                .id(draft.getId())
                .name(draft.getName())
                .fileUrl(draft.getFileUrl())
                .isDefault(draft.getIsDefault())
                .createdAt(draft.getCreatedAt())
                .build();
    }
}
