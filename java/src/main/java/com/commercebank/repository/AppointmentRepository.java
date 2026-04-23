package com.commercebank.repository;

import com.commercebank.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID>,
        JpaSpecificationExecutor<Appointment> {

    /** Used to check for slot conflicts when booking or rescheduling. */
    boolean existsByBranchIdAndDateAndTime(int branchId, LocalDate date, LocalTime time);

    /** Same check but excluding a specific appointment (for reschedule). */
    boolean existsByBranchIdAndDateAndTimeAndIdNot(int branchId, LocalDate date, LocalTime time, UUID id);

    /** Returns all booked time strings for a branch on a given date. */
    @Query("SELECT a.time FROM Appointment a WHERE a.branchId = :branchId AND a.date = :date")
    List<LocalTime> findBookedTimesByBranchAndDate(@Param("branchId") int branchId,
                                                   @Param("date") LocalDate date);

    /** Find all appointments ordered newest first — used by the admin dashboard. */
    List<Appointment> findAllByOrderByDateDesc();

    /** Search by customer name or email (case-insensitive). */
    @Query("""
            SELECT a FROM Appointment a
            WHERE LOWER(a.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(a.lastName)  LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(a.email)     LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY a.date DESC
            """)
    List<Appointment> searchByNameOrEmail(@Param("q") String query);

    /** Date-range filter. */
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.date BETWEEN :from AND :to
            ORDER BY a.date DESC
            """)
    List<Appointment> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
