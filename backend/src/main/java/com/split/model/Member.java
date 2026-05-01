package com.split.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String archetype;
    private double balance = 0.0;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private TripGroup group;

    public Member() {}
    public Member(String name, String archetype, TripGroup group) {
        this.name = name; this.archetype = archetype; this.group = group;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    public String getArchetype() { return archetype; }
    public void setArchetype(String a) { this.archetype = a; }
    public double getBalance() { return balance; }
    public void setBalance(double b) { this.balance = b; }
    public TripGroup getGroup() { return group; }
    public void setGroup(TripGroup g) { this.group = g; }
}