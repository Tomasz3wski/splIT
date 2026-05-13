package com.split.service;

import com.split.dto.AddPastExpenseRequest;
import com.split.dto.CreateUserRequest;
import com.split.model.PastExpense;
import com.split.model.UserAccount;
import com.split.repository.PastExpenseRepository;
import com.split.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserAccountRepository userRepository;
    private final PastExpenseRepository pastExpenseRepository;

    public UserService(UserAccountRepository userRepository, PastExpenseRepository pastExpenseRepository) {
        this.userRepository = userRepository;
        this.pastExpenseRepository = pastExpenseRepository;
    }

    public UserAccount createUser(CreateUserRequest req) {
        UserAccount user = new UserAccount(req.username);
        return userRepository.save(user);
    }

    public PastExpense addPastExpense(String username, AddPastExpenseRequest req) {
        UserAccount user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        PastExpense expense = new PastExpense(req.category, req.amount, user);
        pastExpenseRepository.save(expense);

        user.getPastExpenses().add(expense);
        updateUserArchetype(user);
        return expense;
    }

    public UserAccount getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private void updateUserArchetype(UserAccount user) {
        List<PastExpense> expenses = user.getPastExpenses();
        if (expenses.isEmpty()) {
            user.setArchetype("Standard");
            userRepository.save(user);
            return;
        }

        double total = 0;
        double foodAndDrinks = 0;
        double travelAndHotel = 0;

        for (PastExpense e : expenses) {
            total += e.getAmount();
            String cat = e.getCategory().toLowerCase();
            if (cat.contains("food") || cat.contains("drink") || cat.contains("restaurant") || cat.contains("bar")) {
                foodAndDrinks += e.getAmount();
            } else if (cat.contains("flight") || cat.contains("hotel") || cat.contains("taxi") || cat.contains("transport")) {
                travelAndHotel += e.getAmount();
            }
        }

        if (travelAndHotel / total > 0.5) {
            user.setArchetype("Luxury");
        } else if (foodAndDrinks / total > 0.5) {
            user.setArchetype("Foodie");
        } else {
            user.setArchetype("Budget");
        }

        userRepository.save(user);
    }
}