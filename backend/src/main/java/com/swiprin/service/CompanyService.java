package com.swiprin.service;

import com.swiprin.dto.request.CreateCompanyRequest;
import com.swiprin.dto.request.UpdateCompanyRequest;
import com.swiprin.dto.response.CompanyResponse;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.exception.BadRequestException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.Company;
import com.swiprin.repository.CompanyRepository;
import com.swiprin.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;

    public PageResponse<CompanyResponse> getAll(String search, Pageable pageable) {
        Page<Company> page = (search != null && !search.isBlank())
                ? companyRepository.findByNameContainingIgnoreCase(search.trim(), pageable)
                : companyRepository.findAll(pageable);
        return toPageResponse(page);
    }

    public CompanyResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public CompanyResponse create(CreateCompanyRequest req) {
        String name = req.getName().trim();
        if (companyRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Company already exists: " + name);
        }
        Company company = Company.builder()
                .name(name)
                .website(req.getWebsite())
                .description(req.getDescription())
                .isVerified(false)
                .build();
        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public CompanyResponse update(Long id, UpdateCompanyRequest req) {
        Company company = findOrThrow(id);
        if (req.getName() != null) {
            String name = req.getName().trim();
            if (!company.getName().equalsIgnoreCase(name) && companyRepository.existsByNameIgnoreCase(name)) {
                throw new BadRequestException("Company already exists: " + name);
            }
            company.setName(name);
        }
        if (req.getWebsite() != null) company.setWebsite(req.getWebsite());
        if (req.getDescription() != null) company.setDescription(req.getDescription());
        if (req.getLogoUrl() != null) company.setLogoUrl(req.getLogoUrl());
        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public CompanyResponse verify(Long id) {
        Company company = findOrThrow(id);
        company.setIsVerified(true);
        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public void delete(Long id) {
        companyRepository.delete(findOrThrow(id));
    }

    private Company findOrThrow(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + id));
    }

    public CompanyResponse toResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .website(company.getWebsite())
                .description(company.getDescription())
                .logoUrl(company.getLogoUrl())
                .isVerified(company.getIsVerified())
                .jobCount(jobRepository.countByCompanyIdAndActiveTrue(company.getId()))
                .createdAt(company.getCreatedAt())
                .build();
    }

    private PageResponse<CompanyResponse> toPageResponse(Page<Company> page) {
        return PageResponse.<CompanyResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
