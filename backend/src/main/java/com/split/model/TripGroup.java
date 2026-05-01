package com.split.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trip_group")
public class TripGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    private String destination;
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Member> members = new ArrayList<>();
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Expense> expenses = new ArrayList<>();

    public TripGroup() {}
    public TripGroup(String name, String destination) { this.name = name; this.destination = destination; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    public String getDestination() { return destination; }
    public void setDestination(String d) { this.destination = d; }
    public List<Member> getMembers() { return members; }
    public List<Expense> getExpenses() { return expenses; }
}