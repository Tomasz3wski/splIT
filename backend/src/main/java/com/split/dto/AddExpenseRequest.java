package com.split.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class AddExpenseRequest {
    @NotBlank  public String category;
    @Positive  public double amount;
    public String actualPayerName;
}