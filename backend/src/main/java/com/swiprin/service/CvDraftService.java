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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CvDraftService {

    private final CvDraftRepository cvDraftRepository;
    private final UserRepository userRepository;

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

        CvDraft draft = CvDraft.builder()
                .user(user)
                .name(req.getName().trim())
                .isDefault(Boolean.TRUE.equals(req.getIsDefault()))
                .deleted(false)
                .build();

        return toResponse(cvDraftRepository.save(draft));
    }

    @Transactional
    public CvDraftResponse update(Long id, CreateCvDraftRequest req, Long userId) {
        CvDraft draft = findOwnedOrThrow(id, userId);

        if (req.getName() != null) draft.setName(req.getName().trim());

        if (Boolean.TRUE.equals(req.getIsDefault()) && !Boolean.TRUE.equals(draft.getIsDefault())) {
            cvDraftRepository.clearDefaultForUser(userId);
            draft.setIsDefault(true);
        }

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
