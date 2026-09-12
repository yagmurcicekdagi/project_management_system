package com.example.project_management_system.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.description;
import static org.mockito.Mockito.when;

import java.time.LocalDate;

import org.hibernate.boot.model.internal.GeneratorBinder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.project_management_system.dtos.task.TaskCreateRequest;
import com.example.project_management_system.entities.Task;
import com.example.project_management_system.entities.TaskPriority;
import com.example.project_management_system.entities.TaskStatus;
import com.example.project_management_system.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService Unit Tests")
class TaskServiceTest {

  @Mock
  TaskRepository taskRepository;

  @InjectMocks
  TaskService service;

  @Test
  @DisplayName("should save and return the created task")
  void create_shouldSaveAndReturnTask() {
    // Arrange
    TaskCreateRequest req = new TaskCreateRequest("   Implement feature", "BUILD the task entity",
        TaskPriority.MEDIUM,
        TaskStatus.TODO, LocalDate.of(2026, 9, 12), LocalDate.of(2026, 9, 20));

    // Answer with the invoked method's first argument? -return exactly what was
    // passed to save()
    when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

    // Act
    Task result = service.create(req);

    // Assert
    assertThat(result.getTitle()).isEqualTo("Implement feature");
    assertThat(result.getDescription()).isEqualTo("build the task entity");
    assertThat(result.getPriority()).isEqualTo(TaskPriority.MEDIUM);
    assertThat(result.getStatus()).isEqualTo(TaskStatus.TODO);
    assertThat(result.getStartDate()).isEqualTo(LocalDate.of(2026, 9, 12));
    assertThat(result.getEndDate()).isEqualTo(LocalDate.of(2026, 9, 20));
  }
}
