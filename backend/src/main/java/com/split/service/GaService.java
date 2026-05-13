package com.split.service;

import com.split.dto.SuggestResponse;
import com.split.model.Member;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GaService {

    private final RestTemplate restTemplate;

    @Value("${ga.service.url}")
    private String gaServiceUrl;

    public GaService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public SuggestResponse suggest(List<Member> members, double amount, String category) {
        List<Map<String, Object>> memberPayload = members.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", m.getName());
            map.put("archetype", m.getArchetype());
            map.put("balance", m.getBalance());
            map.put("budget", m.getBudget());
            map.put("totalPaid", m.getTotalPaid());
            return map;
        }).toList();

        Map<String, Object> payload = new HashMap<>();
        payload.put("members", memberPayload);
        payload.put("amount", amount);
        payload.put("category", category);

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    gaServiceUrl + "/suggest", payload, Map.class);

            String payerName = (String) response.get("payer");
            String archetype = (String) response.get("archetype");
            List<Map<String, Object>> variances = (List<Map<String, Object>>) response.get("member_variances");
            return new SuggestResponse(payerName, archetype, amount, category, variances, List.of());
        } catch (Exception e) {
            return fallback(members, amount, category);
        }
    }

    private SuggestResponse fallback(List<Member> members, double amount, String category) {
        Member best = members.stream().max(Comparator.comparingDouble(Member::getBalance)).get();
        return new SuggestResponse(best.getName(), best.getArchetype(), amount, category, List.of(), List.of());
    }
}