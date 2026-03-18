package com.example.project_management_system.services;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.project_management_system.dtos.employee.EmployeeCreateRequest;
import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.dtos.employee.EmployeeUpdateRequest;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.EmployeeMapper;
import com.example.project_management_system.repository.EmployeeRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeService Unit Tests")
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeMapper mapper;

    @InjectMocks
    private EmployeeService service;

    @Test
    @DisplayName("create() should save with correct fields and return mapped response")
    void create_shouldSaveAndReturnMapped() {
        // Arrange
        EmployeeCreateRequest req = new EmployeeCreateRequest("Jane", "Doe", "jane@example.com");
        Employee saved = Employee.builder().id(1L).firstName("Jane").lastName("Doe").email("jane@example.com").build();
        EmployeeResponse expected = new EmployeeResponse(1L, "Jane", "Doe", "jane@example.com", null);
        when(employeeRepository.save(any(Employee.class))).thenReturn(saved);
        when(mapper.toDTO(saved)).thenReturn(expected);

        // Act
        EmployeeResponse result = service.create(req);

        // Assert - repository.save called once with correct args
        assertThat(result).isEqualTo(expected);
        verify(employeeRepository).save(argThat(e
                -> e.getFirstName().equals("Jane")
                && e.getLastName().equals("Doe")
        ));
    }

    @Nested
    @DisplayName("findAll()")
    class FindAll {

        private Pageable pageable;
        private Employee e1;
        private Employee e2;
        private EmployeeResponse r1;
        private EmployeeResponse r2;

        @BeforeEach
        void setUp() {
            pageable = PageRequest.of(0, 5);
            e1 = Employee.builder().id(1L).firstName("Jane").lastName("Doe").build();
            e2 = Employee.builder().id(2L).firstName("John").lastName("Smith").build();
            r1 = new EmployeeResponse(1L, "Jane", "Doe", "jane@example.com", null);
            r2 = new EmployeeResponse(2L, "John", "Smith", "john@example.com", null);

        }

        @Test
        @DisplayName("should call repository.findAll when search is null or blank")
        void findAll_noSearch_usesFindAll() {
            when(employeeRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(e1, e2)));
            when(mapper.toDTO(e1)).thenReturn(r1);
            when(mapper.toDTO(e2)).thenReturn(r2);

            Page<EmployeeResponse> page = service.findAll(null, pageable);

            assertThat(page.getTotalElements()).isEqualTo(2L);
            assertThat(page.getContent()).contains(r1, r2);
            verify(employeeRepository).findAll(pageable);
            verify(employeeRepository, never())
                    .searchByFullName(any(), any());

        }

        @Test
        @DisplayName("should trim search and query by first or last name")
        void findAll_withSearch_queriesByName() {
            String raw = "  Jane  ";
            String trimmed = "Jane";
            when(employeeRepository.searchByFullName(trimmed, pageable))
                    .thenReturn(new PageImpl<>(List.of(e1)));

            Page<EmployeeResponse> page = service.findAll(raw, pageable);

            assertThat(page.getTotalElements()).isEqualTo(1L);
            verify(employeeRepository)
                    .searchByFullName(trimmed, pageable);
            verify(employeeRepository, never()).findAll(any(Pageable.class));
            verify(mapper).toDTO(e1);
        }
    }

    @Nested
    @DisplayName("findById()")
    class FindById {

        @Test
        @DisplayName("should return mapped dto when employee exists")
        void findById_exists_returnsDto() {
            Employee e = Employee.builder().id(10L).firstName("Alice").lastName("Wonder").build();
            EmployeeResponse expected = new EmployeeResponse(10L, "Alice", "Wonder", "alice@example.com", null);
            when(employeeRepository.findById(10L)).thenReturn(Optional.of(e));
            when(mapper.toDTO(e)).thenReturn(expected);

            EmployeeResponse result = service.findById(10L);

            assertThat(result).isEqualTo(expected);
            verify(employeeRepository).findById(10L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when employee missing")
        void findById_missing_throws() {
            when(employeeRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(404L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("404");
            verify(employeeRepository).findById(404L);
            verify(mapper, never()).toDTO(any());
        }
    }

    @Nested
    @DisplayName("patch()")
    class Patch {

        @Test
        @DisplayName("should update non-null fields, trim values, and return mapped dto")
        void patch_updatesAndReturnsMapped() {
            Employee existing = Employee.builder().id(5L).firstName("Old").lastName("Name").build();
            EmployeeUpdateRequest req = new EmployeeUpdateRequest("  New  ", "  Last  ");
            EmployeeResponse expected = new EmployeeResponse(5L, "New", "Last", "new@example.com", null);

            when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(employeeRepository.save(existing)).thenReturn(existing);
            when(mapper.toDTO(existing)).thenReturn(expected);

            EmployeeResponse result = service.update(5L, req);

            assertThat(existing.getFirstName()).isEqualTo("New");
            assertThat(existing.getLastName()).isEqualTo("Last");
            assertThat(result).isEqualTo(expected);
            verify(employeeRepository).findById(5L);
            verify(employeeRepository).save(existing);
        }

        @Test
        @DisplayName("should throw when patching non-existent employee")
        void patch_missing_throws() {
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

            EmployeeUpdateRequest req = new EmployeeUpdateRequest("A", "B");

            assertThatThrownBy(() -> service.update(999L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
            verify(employeeRepository).findById(999L);
            verify(mapper, never()).toDTO(any());
        }
    }

    @Nested
    @DisplayName("deleteById()")
    class DeleteById {

        @Test
        @DisplayName("should delete when employee exists")
        void delete_exists_deletes() {
            when(employeeRepository.existsById(7L)).thenReturn(true);

            service.deleteById(7L);

            verify(employeeRepository).existsById(7L);
            verify(employeeRepository).deleteById(7L);
        }

        @Test
        @DisplayName("should throw and not delete when employee missing")
        void delete_missing_throws() {
            when(employeeRepository.existsById(8L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteById(8L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("8");
            verify(employeeRepository).existsById(8L);
            verify(employeeRepository, never()).deleteById(any());
        }
    }
}
