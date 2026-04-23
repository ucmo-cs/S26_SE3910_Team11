package com.commercebank;

import com.commercebank.model.ReferenceData;
import com.commercebank.service.TimeSlotService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class TimeSlotServiceTest {

    TimeSlotService service = new TimeSlotService();

    @Test
    void generates16Slots() {
        // 09:00–16:30 in 30-min increments = 16 slots
        List<TimeSlotService.TimeSlot> slots = service.generateSlots();
        assertThat(slots).hasSize(16);
    }

    @Test
    void firstSlotIs9am() {
        assertThat(service.generateSlots().get(0).time()).isEqualTo("09:00");
    }

    @Test
    void lastSlotIs4_30pm() {
        List<TimeSlotService.TimeSlot> slots = service.generateSlots();
        assertThat(slots.get(slots.size() - 1).time()).isEqualTo("16:30");
    }

    @Test
    void labelsAreHumanReadable() {
        TimeSlotService.TimeSlot nine = service.generateSlots().get(0);
        assertThat(nine.label()).contains("AM");
    }
}

class ReferenceDataTest {

    @Test
    void topicById_known_returnsCorrectTopic() {
        ReferenceData.Topic topic = ReferenceData.topicById(1);
        assertThat(topic.name()).isEqualTo("Open an account");
    }

    @Test
    void topicById_unknown_throws() {
        assertThatThrownBy(() -> ReferenceData.topicById(99))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void branchById_known_returns() {
        ReferenceData.Branch branch = ReferenceData.branchById(1);
        assertThat(branch.name()).isEqualTo("Southland Shopping Center");
        assertThat(branch.city()).isEqualTo("Harrisonville");
    }

    @Test
    void branchesByTopic_filtersCorrectly() {
        // Topic 3 (wealth management) is only at branch 2
        List<ReferenceData.Branch> branches = ReferenceData.branchesByTopic(3);
        assertThat(branches).hasSize(1);
        assertThat(branches.get(0).id()).isEqualTo(2);
    }

    @Test
    void branchesByTopic_commonTopic_returnsBoth() {
        // Topic 4 (Other) is at both branches
        List<ReferenceData.Branch> branches = ReferenceData.branchesByTopic(4);
        assertThat(branches).hasSize(2);
    }
}
