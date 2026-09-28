package com.greenlog.service;

import com.greenlog.entity.CheckIn;
import com.greenlog.entity.Tree;
import com.greenlog.exception.BusinessRuleException;
import com.greenlog.exception.ResourceNotFoundException;
import com.greenlog.repository.CheckInRepository;
import com.greenlog.repository.TreeRepository;
import com.greenlog.repository.PlantationDriveRepository;
import com.greenlog.repository.VolunteerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TreeService {
    private static final int CHECK_IN_INTERVAL_DAYS = 30;

    private final TreeRepository treeRepository;
    private final VolunteerRepository volunteerRepository;
    private final CheckInRepository checkInRepository;
    private final PlantationDriveRepository driveRepository;

    public TreeService(TreeRepository treeRepository, VolunteerRepository volunteerRepository,
                       CheckInRepository checkInRepository, PlantationDriveRepository driveRepository) {
        this.treeRepository = treeRepository;
        this.volunteerRepository = volunteerRepository;
        this.checkInRepository = checkInRepository;
        this.driveRepository = driveRepository;
    }

    public Tree create(Tree tree) {
        if (tree.getDrive() == null || tree.getDrive().getId() == null) {
            throw new BusinessRuleException("drive.id is required");
        }
        if (tree.getPlantedBy() == null || tree.getPlantedBy().getId() == null) {
            throw new BusinessRuleException("plantedBy.id is required");
        }
        if (!driveRepository.existsById(tree.getDrive().getId())) {
            throw new ResourceNotFoundException("Plantation drive not found");
        }
        if (!volunteerRepository.existsById(tree.getPlantedBy().getId())) {
            throw new ResourceNotFoundException("Volunteer not found");
        }
        tree.setStatus(Tree.Status.ALIVE);
        tree.setNextCheckInDate(tree.getDatePlanted().plusDays(CHECK_IN_INTERVAL_DAYS));
        return treeRepository.save(tree);
    }

    public List<Tree> dueTrees() {
        return treeRepository.findByStatusAndNextCheckInDateLessThanEqual(Tree.Status.ALIVE, LocalDate.now());
    }

    @Transactional
    public CheckIn addCheckIn(CheckIn checkIn) {
        if (checkIn.getTree() == null || checkIn.getTree().getId() == null) {
            throw new BusinessRuleException("tree.id is required");
        }
        if (checkIn.getVolunteer() == null || checkIn.getVolunteer().getId() == null) {
            throw new BusinessRuleException("volunteer.id is required");
        }

        Tree tree = treeRepository.findById(checkIn.getTree().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tree not found"));

        if (tree.getStatus() == Tree.Status.DEAD) {
            throw new BusinessRuleException("A tree marked dead cannot receive further check-ins");
        }
        if (checkIn.getCheckInDate().isBefore(tree.getDatePlanted())) {
            throw new BusinessRuleException("Check-in date cannot be before the planting date");
        }
        if (!volunteerRepository.existsById(checkIn.getVolunteer().getId())) {
            throw new ResourceNotFoundException("Volunteer not found");
        }

        tree.setStatus(Boolean.TRUE.equals(checkIn.getAlive()) ? Tree.Status.ALIVE : Tree.Status.DEAD);
        tree.setNextCheckInDate(checkIn.getCheckInDate().plusDays(CHECK_IN_INTERVAL_DAYS));
        treeRepository.save(tree);

        checkIn.setTree(tree);
        return checkInRepository.save(checkIn);
    }
}
