package com.greenlog.controller;

import com.greenlog.entity.PlantationDrive;
import com.greenlog.repository.PlantationDriveRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drives")
public class PlantationDriveController {
    private final PlantationDriveRepository repository;

    public PlantationDriveController(PlantationDriveRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PlantationDrive> all() { return repository.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlantationDrive create(@Valid @RequestBody PlantationDrive drive) { return repository.save(drive); }
}
