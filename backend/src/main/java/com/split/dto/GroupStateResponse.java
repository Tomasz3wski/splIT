package com.split.dto;

import java.util.List;

public class GroupStateResponse {
    public Long groupId;
    public String name;
    public String destination;
    public List<MemberBalance> members;
    public int totalExpenses;
    public double finalVariance;

    public static class MemberBalance {
        public Long id;
        public String name;
        public String archetype;
        public double balance;
    }
}