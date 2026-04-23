package com.commercebank.model;

import java.util.List;

/**
 * Static reference data — topics and branches.
 * Mirrors appointmentData.ts from the React project.
 * In a production system these would be database tables;
 * keeping them here preserves parity with the original design.
 */
public final class ReferenceData {

    private ReferenceData() {}

    public record Topic(int id, String name) {}

    public record Branch(int id, String name, String address, String city,
                         String state, String zip, List<Integer> supportedTopicIds) {}

    public static final List<Topic> TOPICS = List.of(
            new Topic(1, "Open an account"),
            new Topic(2, "Loan and mortgage consultation"),
            new Topic(3, "Financial planning and wealth management"),
            new Topic(4, "Other")
    );

    public static final List<Branch> BRANCHES = List.of(
            new Branch(1, "Southland Shopping Center",
                    "1731 E Mechanic St", "Harrisonville", "MO", "64701",
                    List.of(1, 2, 4)),
            new Branch(2, "Harrisonville Main Branch & ATM",
                    "1301 Locust St", "Harrisonville", "MO", "64701",
                    List.of(1, 3, 4))
    );

    public static List<Branch> branchesByTopic(int topicId) {
        return BRANCHES.stream()
                .filter(b -> b.supportedTopicIds().contains(topicId))
                .toList();
    }

    public static Topic topicById(int id) {
        return TOPICS.stream()
                .filter(t -> t.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown topic id: " + id));
    }

    public static Branch branchById(int id) {
        return BRANCHES.stream()
                .filter(b -> b.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown branch id: " + id));
    }
}
