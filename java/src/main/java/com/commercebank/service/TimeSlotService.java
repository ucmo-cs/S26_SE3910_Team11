package com.commercebank.service;

import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Mirrors generateTimeSlots() from appointmentData.ts.
 * Generates half-hour slots from 09:00 to 16:30 (last slot before 17:00).
 */
@Service
public class TimeSlotService {

    public record TimeSlot(String time, String label) {}

    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("h:mm a");

    public List<TimeSlot> generateSlots() {
        List<TimeSlot> slots = new ArrayList<>();
        LocalTime cursor = LocalTime.of(9, 0);
        LocalTime end    = LocalTime.of(17, 0);

        while (cursor.isBefore(end)) {
            slots.add(new TimeSlot(
                    cursor.format(DateTimeFormatter.ofPattern("HH:mm")),
                    cursor.format(DISPLAY)
            ));
            cursor = cursor.plusMinutes(30);
        }
        return slots;
    }
}
