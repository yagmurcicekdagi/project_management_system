package com.example.project_management_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project_management_system.entities.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // which projects does employee X belong to?
    @Query("SELECT DISTINCT p FROM Project p JOIN p.assignments a WHERE a.employee.id = :employeeId")
    Page<Project> findByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);
}
