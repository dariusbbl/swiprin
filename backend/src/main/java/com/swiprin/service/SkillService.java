package com.swiprin.service;

import com.swiprin.dto.request.CreateSkillRequest;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.dto.response.SkillResponse;
import com.swiprin.exception.BadRequestException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.Skill;
import com.swiprin.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    public PageResponse<SkillResponse> getAll(String search, Pageable pageable) {
        Page<Skill> page = (search != null && !search.isBlank())
                ? skillRepository.findByNameContainingIgnoreCase(search.trim(), pageable)
                : skillRepository.findAll(pageable);
        return toPageResponse(page);
    }

    public SkillResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public SkillResponse create(CreateSkillRequest req) {
        String name = req.getName().trim();
        if (skillRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Skill already exists: " + name);
        }
        Skill skill = skillRepository.save(Skill.builder().name(name).build());
        return toResponse(skill);
    }

    @Transactional
    public SkillResponse update(Long id, CreateSkillRequest req) {
        String name = req.getName().trim();
        Skill skill = findOrThrow(id);
        if (!skill.getName().equalsIgnoreCase(name) && skillRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Skill already exists: " + name);
        }
        skill.setName(name);
        return toResponse(skillRepository.save(skill));
    }

    @Transactional
    public void delete(Long id) {
        skillRepository.delete(findOrThrow(id));
    }

    private Skill findOrThrow(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found: " + id));
    }

    public static SkillResponse toResponse(Skill skill) {
        return SkillResponse.builder()
                .id(skill.getId())
                .name(skill.getName())
                .build();
    }

    private PageResponse<SkillResponse> toPageResponse(Page<Skill> page) {
        return PageResponse.<SkillResponse>builder()
                .content(page.getContent().stream().map(SkillService::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
