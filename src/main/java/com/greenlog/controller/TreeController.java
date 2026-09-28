package com.greenlog.controller;

import com.greenlog.entity.Tree;
import com.greenlog.repository.TreeRepository;
import com.greenlog.service.TreeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trees")
public class TreeController {
    private final TreeRepository repository;
    private final TreeService service;

    public TreeController(TreeRepository repository, TreeService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping
    public List<Tree> all() { return repository.findAll(); }

    @GetMapping("/due")
    public List<Tree> due() { return service.dueTrees(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Tree create(@Valid @RequestBody Tree tree) { return service.create(tree); }
}
