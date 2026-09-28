package com.greenlog.controller;

import com.greenlog.entity.Volunteer;
import com.greenlog.repository.VolunteerRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteers")
public class VolunteerController {
    private final VolunteerRepository repository;

    public VolunteerController(VolunteerRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Volunteer> all() { return repository.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Volunteer create(@Valid @RequestBody Volunteer volunteer) { return repository.save(volunteer); }
}
