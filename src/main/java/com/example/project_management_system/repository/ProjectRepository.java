package com.example.project_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project_management_system.entities.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
