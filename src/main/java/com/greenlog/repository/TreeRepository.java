package com.greenlog.repository;

import com.greenlog.entity.Tree;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TreeRepository extends JpaRepository<Tree, Long> {
    List<Tree> findByStatusAndNextCheckInDateLessThanEqual(Tree.Status status, LocalDate date);
}
