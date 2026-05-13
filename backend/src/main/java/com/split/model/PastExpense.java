package com.split.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class PastExpense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String category;
    @Column(nullable = false) private double amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_account_id", nullable = false)
    @JsonIgnore
    private UserAccount userAccount;

    public PastExpense() {}

    public PastExpense(String category, double amount, UserAccount userAccount) {
        this.category = category;
        this.amount = amount;
        this.userAccount = userAccount;
    }

    public Long getId() { return id; }
    public String getCategory() { return category; }
    public void setCategory(String c) { this.category = c; }
    public double getAmount() { return amount; }
    public void setAmount(double a) { this.amount = a; }
    public UserAccount getUserAccount() { return userAccount; }
    public void setUserAccount(UserAccount u) { this.userAccount = u; }
}