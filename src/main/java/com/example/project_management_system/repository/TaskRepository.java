package com.example.project_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.example.project_management_system.entities.Task;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

  List<Task> findByProjectId(@Param("projectId") Long projectId);

}
