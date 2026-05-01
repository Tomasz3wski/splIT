package com.split.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String category;
    @Column(nullable = false) private double amount;
    private String suggestedPayerName;
    private String actualPayerName;
    private double balanceVarianceBefore;
    private double balanceVarianceAfter;
    private LocalDateTime createdAt = LocalDateTime.now();
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private TripGroup group;

    public Expense() {}
    public Long getId() { return id; }
    public String getCategory() { return category; }
    public void setCategory(String c) { this.category = c; }
    public double getAmount() { return amount; }
    public void setAmount(double a) { this.amount = a; }
    public String getSuggestedPayerName() { return suggestedPayerName; }
    public void setSuggestedPayerName(String s) { this.suggestedPayerName = s; }
    public String getActualPayerName() { return actualPayerName; }
    public void setActualPayerName(String s) { this.actualPayerName = s; }
    public double getBalanceVarianceBefore() { return balanceVarianceBefore; }
    public void setBalanceVarianceBefore(double v) { this.balanceVarianceBefore = v; }
    public double getBalanceVarianceAfter() { return balanceVarianceAfter; }
    public void setBalanceVarianceAfter(double v) { this.balanceVarianceAfter = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public TripGroup getGroup() { return group; }
    public void setGroup(TripGroup g) { this.group = g; }
}