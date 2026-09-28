package com.greenlog.controller;

import com.greenlog.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/survival-rate")
    public List<Map<String, Object>> survivalRate() { return service.survivalRate(); }

    @GetMapping("/leaderboard")
    public List<Map<String, Object>> leaderboard() { return service.leaderboard(); }
}
