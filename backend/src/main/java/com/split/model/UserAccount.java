package com.split.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    private String archetype = "Standard";

    @JsonIgnore
    @OneToMany(mappedBy = "userAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PastExpense> pastExpenses = new ArrayList<>();

    public UserAccount() {}

    public UserAccount(String username) {
        this.username = username;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String u) { this.username = u; }
    public String getArchetype() { return archetype; }
    public void setArchetype(String a) { this.archetype = a; }
    public List<PastExpense> getPastExpenses() { return pastExpenses; }
    public void setPastExpenses(List<PastExpense> p) { this.pastExpenses = p; }
}