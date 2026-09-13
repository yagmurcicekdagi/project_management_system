package com.example.project_management_system.mappers;

import org.springframework.stereotype.Component;

import com.example.project_management_system.dtos.task.TaskResponse;
import com.example.project_management_system.entities.Task;

@Component
public class TaskMapper {

  public TaskResponse toDTO(Task task) {
    return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.getPriority(), task.getStatus(),
        task.getStartDate(), task.getEndDate());
  }
}
