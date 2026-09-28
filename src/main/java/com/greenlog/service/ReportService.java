package com.greenlog.service;

import com.greenlog.entity.Tree;
import com.greenlog.entity.Volunteer;
import com.greenlog.repository.TreeRepository;
import com.greenlog.repository.VolunteerRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private final TreeRepository treeRepository;
    private final VolunteerRepository volunteerRepository;

    public ReportService(TreeRepository treeRepository, VolunteerRepository volunteerRepository) {
        this.treeRepository = treeRepository;
        this.volunteerRepository = volunteerRepository;
    }

    public List<Map<String, Object>> survivalRate() {
        Map<String, List<Tree>> groups = treeRepository.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getDrive().getId() + "|" + t.getSpecies()));

        List<Map<String, Object>> result = new ArrayList<>();
        groups.forEach((key, trees) -> {
            long alive = trees.stream().filter(t -> t.getStatus() == Tree.Status.ALIVE).count();
            double rate = trees.isEmpty() ? 0 : (alive * 100.0 / trees.size());
            String[] parts = key.split("\\|", 2);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("driveId", Long.valueOf(parts[0]));
            row.put("species", parts[1]);
            row.put("totalTrees", trees.size());
            row.put("aliveTrees", alive);
            row.put("survivalRate", Math.round(rate * 100.0) / 100.0);
            result.add(row);
        });
        return result;
    }

    public List<Map<String, Object>> leaderboard() {
        List<Tree> trees = treeRepository.findAll();
        Map<Long, Long> counts = trees.stream()
                .collect(Collectors.groupingBy(t -> t.getPlantedBy().getId(), Collectors.counting()));

        return volunteerRepository.findAll().stream()
                .filter(v -> counts.containsKey(v.getId()))
                .sorted(Comparator.comparingLong((Volunteer v) -> counts.get(v.getId())).reversed())
                .map(v -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("volunteerId", v.getId());
                    row.put("volunteerName", v.getName());
                    row.put("treesPlanted", counts.get(v.getId()));
                    return row;
                })
                .toList();
    }
}
