package com.split.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class AddPastExpenseRequest {
    @NotBlank public String category;
    @Positive public double amount;
}