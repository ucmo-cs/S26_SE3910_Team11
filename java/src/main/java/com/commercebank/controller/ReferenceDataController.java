package com.commercebank.controller;

import com.commercebank.dto.Dtos;
import com.commercebank.model.ReferenceData;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReferenceDataController {

    /** GET /api/topics */
    @GetMapping("/topics")
    public ResponseEntity<Dtos.TopicsResponse> getTopics() {
        return ResponseEntity.ok(new Dtos.TopicsResponse(ReferenceData.TOPICS));
    }

    /** GET /api/branches?topicId=1  (optional filter) */
    @GetMapping("/branches")
    public ResponseEntity<Dtos.BranchesResponse> getBranches(
            @RequestParam(required = false) Integer topicId) {
        List<ReferenceData.Branch> branches = topicId != null
                ? ReferenceData.branchesByTopic(topicId)
                : ReferenceData.BRANCHES;
        return ResponseEntity.ok(new Dtos.BranchesResponse(branches));
    }
}
