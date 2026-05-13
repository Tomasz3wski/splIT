package com.split.controller;

import com.split.dto.AddPastExpenseRequest;
import com.split.dto.CreateUserRequest;
import com.split.model.PastExpense;
import com.split.model.UserAccount;
import com.split.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserAccount> createUser(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(userService.createUser(req));
    }

    @PostMapping("/{username}/expenses")
    public ResponseEntity<PastExpense> addPastExpense(
            @PathVariable String username,
            @Valid @RequestBody AddPastExpenseRequest req) {
        return ResponseEntity.ok(userService.addPastExpense(username, req));
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserAccount> getUser(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }
}