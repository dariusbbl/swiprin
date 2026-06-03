package com.swiprin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OfferAutoRejectService {

    private final ApplicationService applicationService;

    // Runs every day at 02:00 — auto-rejects offers past their response deadline
    @Scheduled(cron = "0 0 2 * * *")
    public void rejectExpiredOffers() {
        int count = applicationService.autoRejectExpiredOffers();
        if (count > 0) {
            log.info("Auto-rejected {} expired job offers", count);
        }
    }
}
