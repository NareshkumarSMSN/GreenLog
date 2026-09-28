package com.greenlog.controller;

import com.greenlog.entity.CheckIn;
import com.greenlog.repository.CheckInRepository;
import com.greenlog.service.TreeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
public class CheckInController {
    private final CheckInRepository repository;
    private final TreeService service;

    public CheckInController(CheckInRepository repository, TreeService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping("/tree/{treeId}")
    public List<CheckIn> byTree(@PathVariable Long treeId) {
        return repository.findByTreeIdOrderByCheckInDateDesc(treeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckIn create(@Valid @RequestBody CheckIn checkIn) { return service.addCheckIn(checkIn); }
}
