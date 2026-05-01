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

    // POST /api/groups — create a new trip group
    @PostMapping
    public ResponseEntity<TripGroup> createGroup(@Valid @RequestBody CreateGroupRequest req) {
        return ResponseEntity.ok(groupService.createGroup(req));
    }

    // GET /api/groups/{id} — get group state with current balances
    @GetMapping("/{id}")
    public ResponseEntity<GroupStateResponse> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupState(id));
    }

    // GET /api/groups/{id}/suggest?amount=85&category=Restaurant — GA suggestion only
    @GetMapping("/{id}/suggest")
    public ResponseEntity<SuggestResponse> suggest(
            @PathVariable Long id,
            @RequestParam double amount,
            @RequestParam String category) {
        return ResponseEntity.ok(groupService.suggestPayer(id, amount, category));
    }

    // POST /api/groups/{id}/expenses — add expense (GA auto-selects payer if none given)
    @PostMapping("/{id}/expenses")
    public ResponseEntity<Expense> addExpense(
            @PathVariable Long id,
            @Valid @RequestBody AddExpenseRequest req) {
        return ResponseEntity.ok(groupService.addExpense(id, req));
    }

    // GET /api/groups/{id}/expenses — list all expenses
    @GetMapping("/{id}/expenses")
    public ResponseEntity<List<Expense>> getExpenses(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getExpenses(id));
    }
}