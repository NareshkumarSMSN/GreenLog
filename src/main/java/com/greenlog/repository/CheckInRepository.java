package com.greenlog.repository;

import com.greenlog.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
    List<CheckIn> findByTreeIdOrderByCheckInDateDesc(Long treeId);
}
