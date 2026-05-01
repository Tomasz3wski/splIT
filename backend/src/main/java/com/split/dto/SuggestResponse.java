package com.split.dto;

import java.util.List;
import java.util.Map;

public class SuggestResponse {
    public String suggestedPayer;
    public String archetype;
    public double amount;
    public String category;
    public List<Map<String, Object>> memberVariances;
    public List<Double> convergenceHistory;

    public SuggestResponse(String suggestedPayer, String archetype, double amount,
                           String category, List<Map<String, Object>> memberVariances,
                           List<Double> convergenceHistory) {
        this.suggestedPayer = suggestedPayer;
        this.archetype = archetype;
        this.amount = amount;
        this.category = category;
        this.memberVariances = memberVariances;
        this.convergenceHistory = convergenceHistory;
    }
}