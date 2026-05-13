package com.split.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateUserRequest {
    @NotBlank public String username;
}