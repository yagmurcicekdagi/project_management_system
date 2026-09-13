package com.example.project_management_system.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project_management_system.entities.TaskAssignment;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

  boolean existByTaskIdAndEmployeeId(Long taskId, Long projectId);

  Optional<TaskAssignment> findByTaskIdAndEmployeeId(Long taskId, Long employeeId);

  @Modifying
  @Query("DELETE FROM TaskAssignment t WHERE t.task.id = :taskId AND t.employee.id = :employeeId")
  int deleteByTaskIdAndEmployeeId(@Param("taskId") Long taskId, @Param("employeeId") Long employeeId);

}