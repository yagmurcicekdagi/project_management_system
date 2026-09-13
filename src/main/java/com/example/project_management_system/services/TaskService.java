package com.example.project_management_system.services;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.task.TaskCreateRequest;
import com.example.project_management_system.dtos.task.TaskResponse;
import com.example.project_management_system.entities.Task;
import com.example.project_management_system.entities.TaskStatus;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.TaskMapper;
import com.example.project_management_system.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskService {

  private final TaskRepository taskRepository;
  private final TaskMapper mapper;

  // TODO: project??
  @Transactional
  public TaskResponse create(TaskCreateRequest req) {
    Task task = Task.builder().title(req.title().trim())
        .description(req.description().trim().toLowerCase(Locale.ENGLISH))
        .priority(req.priority()).status(req.status() != null ? req.status() : TaskStatus.TODO)
        .startDate(req.startDate()).endDate(req.endDate()).build();

    return mapper.toDTO(taskRepository.save(task));
  }

  // TODO: check permission and role to allow updating task
  @Transactional
  public TaskResponse update(Long id, TaskCreateRequest req) {
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

    return mapper.toDTO(taskRepository.save(task));
  }

  @Transactional(readOnly = true)
  public List<TaskResponse> findByProject(Long id) {
    return taskRepository.findByProjectId(id).stream().map(mapper::toDTO).toList();
  }

  @Transactional(readOnly = true)
  public List<TaskResponse> findAll() {
    return taskRepository.findAll().stream().map(mapper::toDTO).toList();
  }

  @Transactional
  public void deleteById(Long id) {
    if (!taskRepository.existsById(id)) {
      throw ResourceNotFoundException.task(id);
    }
    taskRepository.deleteById(id);
  }

}
