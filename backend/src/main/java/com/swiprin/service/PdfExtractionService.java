package com.swiprin.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class PdfExtractionService {

    private static final Pattern EXPERIENCE_START = Pattern.compile(
        "^\\s*(work\\s+experience|professional\\s+experience|employment|career\\s+history|experience)\\s*$",
        Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
    );

    // Stop reading when we hit another section heading
    private static final Pattern SECTION_END = Pattern.compile(
        "^\\s*(education|volunteering?|projects?|certifications?|skills?|languages?|awards?|" +
        "publications?|references?|interests?|activities|summary|profile|objective)\\s*$",
        Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
    );

    // Non-capturing — explicit capturing groups are added in NAMED_RANGE below
    private static final String MONTH_NAME =
        "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?" +
        "|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

    private static final String PRESENT = "present|current|now|ongoing";

    // Named-month range: [Month] YYYY – [Month] YYYY|present
    // Groups: 1=startMonth, 2=startYear, 3=endMonth, 4=endYear/present
    private static final Pattern NAMED_RANGE = Pattern.compile(
        "(?:(" + MONTH_NAME + ")\\s+)?(\\d{4})\\s*[-–—]\\s*(?:(" + MONTH_NAME + ")\\s+)?(\\d{4}|" + PRESENT + ")",
        Pattern.CASE_INSENSITIVE
    );

    // Numeric month range: MM/YYYY – MM/YYYY|present
    // Groups: 1=startMonth, 2=startYear, 3=endMonth, 4=endYear, 5=present keyword
    private static final Pattern NUMERIC_RANGE = Pattern.compile(
        "(\\d{1,2})/(\\d{4})\\s*[-–—]\\s*(?:(\\d{1,2})/(\\d{4})|(" + PRESENT + "))",
        Pattern.CASE_INSENSITIVE
    );

    private static final Map<String, Integer> MONTH_NUM = Map.ofEntries(
        Map.entry("jan", 1), Map.entry("january", 1),
        Map.entry("feb", 2), Map.entry("february", 2),
        Map.entry("mar", 3), Map.entry("march", 3),
        Map.entry("apr", 4), Map.entry("april", 4),
        Map.entry("may", 5),
        Map.entry("jun", 6), Map.entry("june", 6),
        Map.entry("jul", 7), Map.entry("july", 7),
        Map.entry("aug", 8), Map.entry("august", 8),
        Map.entry("sep", 9), Map.entry("september", 9),
        Map.entry("oct", 10), Map.entry("october", 10),
        Map.entry("nov", 11), Map.entry("november", 11),
        Map.entry("dec", 12), Map.entry("december", 12)
    );

    // -----------------------------------------------------------------------

    public String extractText(Path filePath) {
        if (filePath == null) return null;
        try (PDDocument doc = PDDocument.load(filePath.toFile())) {
            return new PDFTextStripper().getText(doc);
        } catch (Exception e) {
            log.warn("PDF text extraction failed for {}: {}", filePath, e.getMessage());
            return null;
        }
    }

    public float extractExperienceYears(String fullText) {
        if (fullText == null || fullText.isBlank()) return 0f;
        String section = isolateExperienceSection(fullText);
        // Collect all ranges as absolute months, merge, then convert to years
        List<int[]> ranges = collectRangesInMonths(section);
        int totalMonths = mergeAndSumMonths(ranges);
        return Math.min(totalMonths / 12.0f, 40f);
    }

    // -----------------------------------------------------------------------

    // Try to find the Work Experience block; fall back to full text if not found
    private String isolateExperienceSection(String text) {
        Matcher start = EXPERIENCE_START.matcher(text);
        if (!start.find()) return text;

        Matcher end = SECTION_END.matcher(text);
        end.region(start.end(), text.length());

        return text.substring(start.end(), end.find() ? end.start() : text.length());
    }

    private List<int[]> collectRangesInMonths(String text) {
        LocalDate today = LocalDate.now();
        int currentYear  = today.getYear();
        int currentMonth = today.getMonthValue();

        List<int[]> ranges = new ArrayList<>();

        // Named-month ranges: "Jan 2020 – Jul 2021", "2020 – 2023"
        Matcher m = NAMED_RANGE.matcher(text);
        while (m.find()) {
            String startMonthStr = m.group(1);   // may be null
            int startYear        = Integer.parseInt(m.group(2));
            String endMonthStr   = m.group(3);   // may be null
            String endYearOrWord = m.group(4).toLowerCase();

            int endYear;
            int endMonth;
            boolean endIsPresent = !endYearOrWord.matches("\\d+");

            if (endIsPresent) {
                endYear  = currentYear;
                endMonth = currentMonth;
            } else {
                endYear  = Integer.parseInt(endYearOrWord);
                endMonth = endMonthStr != null
                    ? MONTH_NUM.getOrDefault(endMonthStr.toLowerCase(), 12) : -1;
            }

            if (startYear < 1960 || startYear > currentYear) continue;

            int durationMonths;
            if (startMonthStr == null && endMonth == -1) {
                // Year-only range (e.g. 2020 – 2023): treat as exact years
                durationMonths = (endYear - startYear) * 12;
            } else {
                int startMonth = startMonthStr != null
                    ? MONTH_NUM.getOrDefault(startMonthStr.toLowerCase(), 1) : 1;
                if (endMonth == -1) endMonth = 12;
                durationMonths = toAbsMonth(endYear, endMonth) - toAbsMonth(startYear, startMonth) + 1;
            }

            if (durationMonths > 0) {
                int startAbs = toAbsMonth(startYear, startMonthStr != null
                    ? MONTH_NUM.getOrDefault(startMonthStr.toLowerCase(), 1) : 1);
                ranges.add(new int[]{startAbs, startAbs + durationMonths});
            }
        }

        // Numeric ranges: "03/2020 – 06/2021"
        m = NUMERIC_RANGE.matcher(text);
        while (m.find()) {
            int startMonth = Integer.parseInt(m.group(1));
            int startYear  = Integer.parseInt(m.group(2));

            int endMonth, endYear;
            if (m.group(5) != null) {
                // "present" keyword
                endMonth = currentMonth;
                endYear  = currentYear;
            } else {
                endMonth = Integer.parseInt(m.group(3));
                endYear  = Integer.parseInt(m.group(4));
            }

            if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) continue;

            int startAbs = toAbsMonth(startYear, startMonth);
            int endAbs   = toAbsMonth(endYear, endMonth) + 1;

            if (startYear >= 1960 && startYear <= currentYear && endAbs > startAbs) {
                ranges.add(new int[]{startAbs, endAbs});
            }
        }

        return ranges;
    }

    // Merge overlapping month ranges (parallel jobs) and return total months
    private int mergeAndSumMonths(List<int[]> ranges) {
        if (ranges.isEmpty()) return 0;

        ranges.sort((a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();

        for (int[] r : ranges) {
            if (!merged.isEmpty() && r[0] <= merged.get(merged.size() - 1)[1]) {
                merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], r[1]);
            } else {
                merged.add(new int[]{r[0], r[1]});
            }
        }

        int total = 0;
        for (int[] r : merged) total += r[1] - r[0];
        return total;
    }

    // Converts year+month to a single monotonic integer for easy comparison/arithmetic
    private int toAbsMonth(int year, int month) {
        return year * 12 + month;
    }
}
