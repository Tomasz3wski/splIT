package com.split.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateGroupRequest {
    @NotBlank public String name;
    public String destination;
    public List<MemberDto> members;

    public static class MemberDto {
        @NotBlank public String username;
        public double budget;
    }
}