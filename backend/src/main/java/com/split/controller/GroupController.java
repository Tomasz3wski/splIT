package com.split.controller;

import com.split.dto.*;
import com.split.model.Expense;
import com.split.model.TripGroup;
import com.split.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<TripGroup>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @PostMapping
    public ResponseEntity<TripGroup> createGroup(@Valid @RequestBody CreateGroupRequest req) {
        return ResponseEntity.ok(groupService.createGroup(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupStateResponse> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupState(id));
    }

    @GetMapping("/{id}/suggest")
    public ResponseEntity<SuggestResponse> suggest(
            @PathVariable Long id,
            @RequestParam double amount,
            @RequestParam String category) {
        return ResponseEntity.ok(groupService.suggestPayer(id, amount, category));
    }

    @PostMapping("/{id}/expenses")
    public ResponseEntity<Expense> addExpense(
            @PathVariable Long id,
            @Valid @RequestBody AddExpenseRequest req) {
        return ResponseEntity.ok(groupService.addExpense(id, req));
    }

    @GetMapping("/{id}/expenses")
    public ResponseEntity<List<Expense>> getExpenses(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getExpenses(id));
    }
}