package com.example.project_management_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project_management_system.entities.ProjectAssignment;

public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {

    boolean existsByProjectIdAndEmployeeId(Long projectId, Long employeeId);

    Optional<ProjectAssignment> findByProjectIdAndEmployeeId(Long projectId, Long employeeId);

    List<ProjectAssignment> findByProjectId(Long projectId);

    List<ProjectAssignment> findByEmployeeId(Long employeeId);

    void deleteByProjectId(Long projectId);
}
