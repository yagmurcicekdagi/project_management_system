package com.example.project_management_system.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.project.ProjectResponse;
import com.example.project_management_system.dtos.task.TaskCreateRequest;
import com.example.project_management_system.dtos.task.TaskResponse;
import com.example.project_management_system.entities.Task;
import com.example.project_management_system.entities.TaskPriority;
import com.example.project_management_system.entities.TaskStatus;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskService {

  private final TaskRepository taskRepository;

  // TODO: should return dto
  @Transactional
  public Task create(TaskCreateRequest req) {
    Task task = Task.builder().title(req.title().trim()).description(req.description().trim().toLowerCase())
        .priority(req.priority()).status(req.status() != null ? req.status() : TaskStatus.TODO)
        .startDate(req.startDate()).endDate(req.endDate()).build();

    taskRepository.save(task);
    return task;
  }

  // TODO: check permission and role to allow updating task
  @Transactional
  public Task update(Long id, TaskCreateRequest req) {
    Task task = taskRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.task(id));

    if (req.title() != null) {
      task.setTitle(req.title());
    }

    if (req.description() != null) {
      task.setDescription(req.description().trim());
    }

    if (req.priority() != null) {
      task.setPriority(req.priority());
    }

    if (req.status() != null) {
      task.setStatus(req.status());
    }

    if (req.startDate() != null) {
      task.setStartDate(req.startDate());
    }

    if (req.endDate() != null) {
      task.setEndDate(req.endDate());
    }

    return task;
  }

  @Transactional(readOnly = true)
  public List<Task> findByProject(Long id) {
    return taskRepository.findByProjectId(id);
  }

  @Transactional(readOnly = true)
  public List<Task> findAll() {
    return taskRepository.findAll();
  }

  @Transactional
  public void deleteById(Long id) {
    if (!taskRepository.existsById(id)) {
      throw ResourceNotFoundException.task(id);
    }
    taskRepository.deleteById(id);
  }

}
