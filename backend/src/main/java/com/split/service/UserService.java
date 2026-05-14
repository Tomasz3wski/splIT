package com.split.service;

import com.split.dto.AddPastExpenseRequest;
import com.split.dto.CreateUserRequest;
import com.split.model.Expense;
import com.split.model.Member;
import com.split.model.PastExpense;
import com.split.model.UserAccount;
import com.split.repository.ExpenseRepository;
import com.split.repository.MemberRepository;
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
    private final ExpenseRepository expenseRepository;
    private final MemberRepository memberRepository;

    public UserService(UserAccountRepository userRepository,
                       PastExpenseRepository pastExpenseRepository,
                       ExpenseRepository expenseRepository,
                       MemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.pastExpenseRepository = pastExpenseRepository;
        this.expenseRepository = expenseRepository;
        this.memberRepository = memberRepository;
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
        updateUserArchetype(username);
        return expense;
    }

    public UserAccount getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public void updateUserArchetype(String username) {
        UserAccount user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;

        List<PastExpense> pastExpenses = user.getPastExpenses();
        List<Expense> groupExpenses = expenseRepository.findByActualPayerName(username);

        if (pastExpenses.isEmpty() && groupExpenses.isEmpty()) {
            user.setArchetype("Standard");
            userRepository.save(user);
            syncMemberArchetypes(username, "Standard");
            return;
        }

        double total = 0;
        double foodAndDrinks = 0;
        double travelAndHotel = 0;

        for (PastExpense e : pastExpenses) {
            total += e.getAmount();
            String cat = e.getCategory().toLowerCase();
            if (cat.equals("restaurant") || cat.equals("groceries") || cat.equals("coffee") || cat.equals("bar")) {
                foodAndDrinks += e.getAmount();
            } else if (cat.equals("flight") || cat.equals("hotel") || cat.equals("taxi") || cat.equals("car rental") || cat.equals("tour")) {
                travelAndHotel += e.getAmount();
            }
        }

        for (Expense e : groupExpenses) {
            total += e.getAmount();
            String cat = e.getCategory().toLowerCase();
            if (cat.equals("restaurant") || cat.equals("groceries") || cat.equals("coffee") || cat.equals("bar")) {
                foodAndDrinks += e.getAmount();
            } else if (cat.equals("flight") || cat.equals("hotel") || cat.equals("taxi") || cat.equals("car rental") || cat.equals("tour")) {
                travelAndHotel += e.getAmount();
            }
        }

        String newArchetype = "Budget";
        if (travelAndHotel / total > 0.5) {
            newArchetype = "Luxury";
        } else if (foodAndDrinks / total > 0.5) {
            newArchetype = "Foodie";
        }

        user.setArchetype(newArchetype);
        userRepository.save(user);
        syncMemberArchetypes(username, newArchetype);
    }

    private void syncMemberArchetypes(String username, String archetype) {
        List<Member> members = memberRepository.findByName(username);
        for (Member m : members) {
            m.setArchetype(archetype);
            memberRepository.save(m);
        }
    }
}