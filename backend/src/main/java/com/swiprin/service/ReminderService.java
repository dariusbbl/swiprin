package com.swiprin.service;

import com.swiprin.model.Application;
import com.swiprin.model.InterviewSchedule;
import com.swiprin.model.enums.NotificationType;
import com.swiprin.repository.ApplicationRepository;
import com.swiprin.repository.InterviewScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final InterviewScheduleRepository interviewScheduleRepository;
    private final ApplicationRepository       applicationRepository;
    private final NotificationService         notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // Runs every day at 08:00 — sends T-1 reminders for interviews and offer deadlines
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        sendInterviewReminders();
        sendOfferDeadlineReminders();
    }

    @Transactional
    public int sendInterviewReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime dayStart = tomorrow.atStartOfDay();
        LocalDateTime dayEnd   = tomorrow.plusDays(1).atStartOfDay();

        List<InterviewSchedule> interviews = interviewScheduleRepository.findAllScheduledBetween(dayStart, dayEnd);
        for (InterviewSchedule i : interviews) {
            Application app = i.getApplication();
            String msg = "Reminder: you have an interview tomorrow at "
                    + i.getScheduledAt().format(TIME_FMT)
                    + " for " + app.getJob().getTitle()
                    + " at <strong>" + app.getJob().getCompany().getName() + "</strong>"
                    + (i.getTitle() != null && !i.getTitle().isBlank()
                        ? " (\"" + i.getTitle() + "\")" : "");
            notificationService.send(
                    app.getUser().getId(),
                    NotificationType.INTERVIEW_REMINDER,
                    msg,
                    i.getId()
            );
        }
        if (!interviews.isEmpty()) {
            log.info("Sent {} interview reminders for {}", interviews.size(), tomorrow);
        }
        return interviews.size();
    }

    @Transactional
    public int sendOfferDeadlineReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Application> offers = applicationRepository.findOffersWithDeadlineOn(tomorrow);
        for (Application app : offers) {
            String msg = "Reminder: your offer for " + app.getJob().getTitle()
                    + " at <strong>" + app.getJob().getCompany().getName() + "</strong>"
                    + " expires tomorrow (" + app.getOfferDeadline().format(DATE_FMT)
                    + "). Please accept or decline before then.";
            notificationService.send(
                    app.getUser().getId(),
                    NotificationType.OFFER_DEADLINE_REMINDER,
                    msg,
                    app.getId()
            );
        }
        if (!offers.isEmpty()) {
            log.info("Sent {} offer deadline reminders for {}", offers.size(), tomorrow);
        }
        return offers.size();
    }
}
