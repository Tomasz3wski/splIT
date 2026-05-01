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

    /**
     * Calls the GA Python microservice and returns a suggestion.
     * Falls back to highest-balance heuristic if GA is unavailable.
     */
    @SuppressWarnings("unchecked")
    public SuggestResponse suggest(List<Member> members, double amount, String category) {
        List<Map<String, Object>> memberPayload = members.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", m.getName());
            map.put("archetype", m.getArchetype());
            map.put("balance", m.getBalance());
            return map;
        }).toList();

        Map<String, Object> payload = new HashMap<>();
        payload.put("members", memberPayload);
        payload.put("amount", amount);
        payload.put("category", category);

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    gaServiceUrl + "/suggest", payload, Map.class);

            if (response == null) throw new RestClientException("null response");

            String payerName     = (String) response.get("payer");
            String archetype     = (String) response.get("archetype");
            List<Double> history = (List<Double>) response.get("convergence_history");
            List<Map<String, Object>> variances = (List<Map<String, Object>>) response.get("member_variances");

            return new SuggestResponse(payerName, archetype, amount, category, variances, history);

        } catch (RestClientException e) {
            // GA microservice not running — fall back to heuristic
            return fallbackSuggest(members, amount, category);
        }
    }

    private SuggestResponse fallbackSuggest(List<Member> members, double amount, String category) {
        Member best = members.stream()
                .max(Comparator.comparingDouble(Member::getBalance))
                .orElse(members.get(0));

        List<Map<String, Object>> variances = members.stream().map(m -> {
            Map<String, Object> v = new HashMap<>();
            v.put("name", m.getName());
            v.put("variance", 0.0);
            return v;
        }).toList();

        return new SuggestResponse(
                best.getName(), best.getArchetype(),
                amount, category, variances, List.of()
        );
    }
}