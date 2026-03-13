package com.example.project_management_system.services;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.entities.Project;
import com.example.project_management_system.entities.ProjectAssignment;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.EmployeeMapper;
import com.example.project_management_system.repository.EmployeeRepository;
import com.example.project_management_system.repository.ProjectAssignmentRepository;
import com.example.project_management_system.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectAssignmentService Unit Tests")
class ProjectAssignmentServiceTest {

    @Mock
    private ProjectAssignmentRepository assignmentRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private EmployeeMapper employeeMapper;

    @InjectMocks
    private ProjectAssignmentService service;

    @Nested
    @DisplayName("addEmployeeToProject()")
    class AddEmployeeToProject {

        @Test
        @DisplayName("should save assignment when project and employee exist and not already assigned")
        void add_ok_saves() {
            Long projectId = 1L;
            Long employeeId = 2L;
            Long assignedBy = 99L;
            Project project = Project.builder().id(projectId).name("P").build();
            Employee employee = Employee.builder().id(employeeId).firstName("Jane").lastName("Doe").build();

            when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
            when(assignmentRepository.existsByProjectIdAndEmployeeId(projectId, employeeId)).thenReturn(false);

            service.addEmployeeToProject(projectId, employeeId, assignedBy);

            verify(assignmentRepository).save(argThat(a
                    -> a.getProject() == project && a.getEmployee() == employee && a.getAssignedBy().equals(assignedBy)
            ));
        }

        @Test
        @DisplayName("should throw when project does not exist")
        void add_missingProject_throws() {
            when(projectRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.addEmployeeToProject(1L, 2L, 3L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("1");
            verify(projectRepository).findById(1L);
            verify(assignmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw when employee does not exist")
        void add_missingEmployee_throws() {
            Project project = Project.builder().id(1L).name("P").build();
            when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
            when(employeeRepository.findById(2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.addEmployeeToProject(1L, 2L, 3L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("2");
            verify(employeeRepository).findById(2L);
            verify(assignmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ConflictException when already assigned")
        void add_conflict_throws() {
            Project project = Project.builder().id(1L).name("P").build();
            Employee employee = Employee.builder().id(2L).firstName("A").lastName("B").build();
            when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
            when(employeeRepository.findById(2L)).thenReturn(Optional.of(employee));
            when(assignmentRepository.existsByProjectIdAndEmployeeId(1L, 2L)).thenReturn(true);

            assertThatThrownBy(() -> service.addEmployeeToProject(1L, 2L, 9L))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already assigned");
            verify(assignmentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("listEmployeesInProject()")
    class ListEmployeesInProject {

        @Test
        @DisplayName("should throw when project does not exist")
        void list_missingProject_throws() {
            when(projectRepository.existsById(5L)).thenReturn(false);

            assertThatThrownBy(() -> service.listEmployeesInProject(5L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("5");
        }

        @Test
        @DisplayName("should map employees from assignments when project exists")
        void list_ok_mapsEmployees() {
            Long projectId = 7L;
            when(projectRepository.existsById(projectId)).thenReturn(true);

            Employee e1 = Employee.builder().id(1L).firstName("Jane").lastName("Doe").build();
            Employee e2 = Employee.builder().id(2L).firstName("John").lastName("Smith").build();

            ProjectAssignment a1 = ProjectAssignment.builder().id(11L).employee(e1).build();
            ProjectAssignment a2 = ProjectAssignment.builder().id(22L).employee(e2).build();

            EmployeeResponse r1 = new EmployeeResponse(1L, "Jane", "Doe", null);
            EmployeeResponse r2 = new EmployeeResponse(2L, "John", "Smith", null);

            when(assignmentRepository.findByProjectId(projectId)).thenReturn(List.of(a1, a2));
            when(employeeMapper.toDTO(e1)).thenReturn(r1);
            when(employeeMapper.toDTO(e2)).thenReturn(r2);

            List<EmployeeResponse> result = service.listEmployeesInProject(projectId);

            assertThat(result).contains(r1, r2);
            verify(projectRepository).existsById(projectId);
            verify(assignmentRepository).findByProjectId(projectId);
            verify(employeeMapper).toDTO(e1);
            verify(employeeMapper).toDTO(e2);
        }
    }

    @Nested
    @DisplayName("removeEmployeeFromProject()")
    class RemoveEmployeeFromProject {

        @Test
        @DisplayName("should delete assignment when found")
        void remove_ok_deletes() {
            Long projectId = 3L;
            Long employeeId = 4L;
            ProjectAssignment assignment = ProjectAssignment.builder().id(100L).build();
            when(assignmentRepository.findByProjectIdAndEmployeeId(projectId, employeeId))
                    .thenReturn(Optional.of(assignment));

            service.removeEmployeeFromProject(projectId, employeeId);

            verify(assignmentRepository).findByProjectIdAndEmployeeId(projectId, employeeId);
            verify(assignmentRepository).delete(assignment);
        }

        @Test
        @DisplayName("should throw when assignment not found")
        void remove_missing_throws() {
            when(assignmentRepository.findByProjectIdAndEmployeeId(3L, 4L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.removeEmployeeFromProject(3L, 4L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Assignment not found");
            verify(assignmentRepository).findByProjectIdAndEmployeeId(3L, 4L);
            verify(assignmentRepository, never()).delete(any());
        }

        @Test
        @DisplayName("should delete all assignments")
        void remove_all_assignments() {
            Long projectId = 3L;

            service.removeAllEmployees(projectId);

            verify(assignmentRepository).deleteByProjectId(projectId);
        }

    }
}
