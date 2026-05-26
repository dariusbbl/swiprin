package com.swiprin.service;

import com.swiprin.model.CvDraft;
import com.swiprin.model.Job;
import com.swiprin.model.User;
import com.swiprin.model.enums.Seniority;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final TextSimilarityService textSimilarityService;

    // FinalMatch = 0.25 * skillMatch + 0.15 * experienceMatch + 0.60 * textSimilarity
    private static final double W_SKILL      = 0.25;
    private static final double W_EXPERIENCE = 0.15;
    private static final double W_TEXT       = 0.60;

    // Compatibility matrix: rows = job seniority, cols = candidate seniority
    // Order: INTERNSHIP(0), JUNIOR(1), MID(2), SENIOR(3)
    private static final int[][] SENIORITY_MATRIX = {
        {100,  80,  60,  40},   // job: INTERNSHIP
        { 60, 100,  80,  60},   // job: JUNIOR
        { 25,  65, 100,  85},   // job: MID
        { 10,  30,  70, 100},   // job: SENIOR
    };

    public int computeMatch(User candidate, Job job, CvDraft cvDraft) {
        double skillMatch      = computeSkillMatch(candidate, job);
        double experienceMatch = computeExperienceMatch(cvDraft, job);
        double textSimilarity  = computeTextSimilarity(cvDraft, job);

        double result = W_SKILL * skillMatch + W_EXPERIENCE * experienceMatch + W_TEXT * textSimilarity;
        return (int) Math.round(Math.min(result, 100.0));
    }

    // -----------------------------------------------------------------------

    private double computeSkillMatch(User candidate, Job job) {
        if (job.getSkills() == null || job.getSkills().isEmpty()) return 100.0;
        if (candidate.getSkills() == null || candidate.getSkills().isEmpty()) return 0.0;

        long overlap = candidate.getSkills().stream()
            .filter(s -> job.getSkills().contains(s))
            .count();
        return (double) overlap / job.getSkills().size() * 100.0;
    }

    private double computeExperienceMatch(CvDraft cvDraft, Job job) {
        if (job.getSeniority() == null) return 100.0;

        float years = (cvDraft != null && cvDraft.getExperienceYears() != null)
            ? cvDraft.getExperienceYears() : 0f;

        int jobIdx       = seniorityIndex(job.getSeniority());
        int candidateIdx = seniorityIndex(yearsToSeniority(years));

        return SENIORITY_MATRIX[jobIdx][candidateIdx];
    }

    private double computeTextSimilarity(CvDraft cvDraft, Job job) {
        if (cvDraft == null || cvDraft.getExtractedText() == null) return 0.0;
        double sim = textSimilarityService.coverageScore(cvDraft.getExtractedText(), job.getDescription());
        return sim * 100.0;
    }

    // Maps experience years to a seniority level using the same ranges as the matrix
    private Seniority yearsToSeniority(float years) {
        if (years < 1) return Seniority.INTERNSHIP;
        if (years < 3) return Seniority.JUNIOR;
        if (years < 5) return Seniority.MID;
        return Seniority.SENIOR;
    }

    private int seniorityIndex(Seniority s) {
        return switch (s) {
            case INTERNSHIP -> 0;
            case JUNIOR     -> 1;
            case MID        -> 2;
            case SENIOR     -> 3;
        };
    }
}
