package com.swiprin.controller;

import com.swiprin.service.ReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reminders")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Reminders")
public class ReminderController {

    private final ReminderService reminderService;

    @PostMapping("/interviews")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually fire T-1 interview reminders (ADMIN only)")
    public ResponseEntity<Map<String, Object>> fireInterviewReminders() {
        int count = reminderService.sendInterviewReminders();
        return ResponseEntity.ok(Map.of("sent", count));
    }

    @PostMapping("/offers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually fire T-1 offer-deadline reminders (ADMIN only)")
    public ResponseEntity<Map<String, Object>> fireOfferReminders() {
        int count = reminderService.sendOfferDeadlineReminders();
        return ResponseEntity.ok(Map.of("sent", count));
    }
}
