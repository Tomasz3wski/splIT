package com.split.service;

import com.split.dto.*;
import com.split.model.*;
import com.split.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GroupService {

    private final TripGroupRepository groupRepo;
    private final MemberRepository memberRepo;
    private final ExpenseRepository expenseRepo;
    private final UserAccountRepository userAccountRepo;
    private final GaService gaService;

    public GroupService(TripGroupRepository groupRepo, MemberRepository memberRepo,
                        ExpenseRepository expenseRepo, UserAccountRepository userAccountRepo, GaService gaService) {
        this.groupRepo  = groupRepo;
        this.memberRepo = memberRepo;
        this.expenseRepo = expenseRepo;
        this.userAccountRepo = userAccountRepo;
        this.gaService  = gaService;
    }

    public TripGroup createGroup(CreateGroupRequest req) {
        TripGroup group = new TripGroup(req.name, req.destination);
        groupRepo.save(group);
        if (req.members != null) {
            for (CreateGroupRequest.MemberDto dto : req.members) {
                UserAccount user = userAccountRepo.findByUsername(dto.username)
                        .orElseThrow(() -> new RuntimeException("User not found: " + dto.username));
                memberRepo.save(new Member(user.getUsername(), user.getArchetype(), dto.budget, group));
            }
        }
        return group;
    }

    public GroupStateResponse getGroupState(Long groupId) {
        TripGroup group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        List<Member> members = memberRepo.findByGroupId(groupId);
        List<Expense> expenses = expenseRepo.findByGroupIdOrderByIdAsc(groupId);

        double[] balances = members.stream().mapToDouble(Member::getBalance).toArray();
        double variance = computeVariance(balances);

        GroupStateResponse resp = new GroupStateResponse();
        resp.groupId       = group.getId();
        resp.name          = group.getName();
        resp.destination   = group.getDestination();
        resp.totalExpenses = expenses.size();
        resp.finalVariance = variance;
        resp.members       = members.stream().map(m -> {
            GroupStateResponse.MemberBalance mb = new GroupStateResponse.MemberBalance();
            mb.id        = m.getId();
            mb.name      = m.getName();
            mb.archetype = m.getArchetype();
            mb.balance   = m.getBalance();
            mb.budget    = m.getBudget();
            mb.totalPaid = m.getTotalPaid();
            return mb;
        }).toList();

        return resp;
    }

    public SuggestResponse suggestPayer(Long groupId, double amount, String category) {
        List<Member> members = memberRepo.findByGroupId(groupId);
        if (members.isEmpty()) throw new RuntimeException("No members in group: " + groupId);
        return gaService.suggest(members, amount, category);
    }

    public Expense addExpense(Long groupId, AddExpenseRequest req) {
        TripGroup group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));
        List<Member> members = memberRepo.findByGroupId(groupId);

        double[] before = members.stream().mapToDouble(Member::getBalance).toArray();
        double varianceBefore = computeVariance(before);

        SuggestResponse suggestion = gaService.suggest(members, req.amount, req.category);
        String payerName = (req.actualPayerName != null && !req.actualPayerName.isBlank())
                ? req.actualPayerName : suggestion.suggestedPayer;

        Member payer = members.stream()
                .filter(m -> m.getName().equalsIgnoreCase(payerName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Payer not found: " + payerName));

        double perPerson = req.amount / members.size();
        for (Member m : members) {
            if (m.getId().equals(payer.getId())) {
                m.setBalance(round(m.getBalance() + req.amount - perPerson));
                m.setTotalPaid(round(m.getTotalPaid() + req.amount));
            } else {
                m.setBalance(round(m.getBalance() - perPerson));
            }
            memberRepo.save(m);
        }

        double[] after = members.stream().mapToDouble(Member::getBalance).toArray();
        double varianceAfter = computeVariance(after);

        Expense expense = new Expense();
        expense.setCategory(req.category);
        expense.setAmount(req.amount);
        expense.setSuggestedPayerName(suggestion.suggestedPayer);
        expense.setActualPayerName(payerName);
        expense.setBalanceVarianceBefore(varianceBefore);
        expense.setBalanceVarianceAfter(varianceAfter);
        expense.setGroup(group);
        return expenseRepo.save(expense);
    }

    public List<Expense> getExpenses(Long groupId) {
        return expenseRepo.findByGroupIdOrderByIdAsc(groupId);
    }

    private double computeVariance(double[] values) {
        if (values.length == 0) return 0;
        double mean = 0;
        for (double v : values) mean += v;
        mean /= values.length;
        double variance = 0;
        for (double v : values) variance += (v - mean) * (v - mean);
        return variance / values.length;
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}