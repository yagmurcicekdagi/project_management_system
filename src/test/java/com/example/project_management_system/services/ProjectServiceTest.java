package com.example.project_management_system.services;

import java.time.LocalDate;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.project_management_system.dtos.project.ProjectCreateRequest;
import com.example.project_management_system.dtos.project.ProjectResponse;
import com.example.project_management_system.dtos.project.ProjectUpdateRequest;
import com.example.project_management_system.entities.Project;
import com.example.project_management_system.entities.ProjectStatus;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.ProjectMapper;
import com.example.project_management_system.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService Unit Tests")
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMapper mapper;

    @InjectMocks
    private ProjectService service;

    @Test
    @DisplayName("create() should default status=NEW when null and return mapped response")
    void create_shouldDefaultStatusAndReturnMapped() {
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 12, 31);
        ProjectCreateRequest req = new ProjectCreateRequest("Alpha", "Desc", null, start, end);

        Project saved = Project.builder()
                .id(1L)
                .name("Alpha")
                .description("Desc")
                .status(ProjectStatus.NEW)
                .startDate(start)
                .endDate(end)
                .build();

        ProjectResponse expected = new ProjectResponse(1L, "Alpha", "Desc", ProjectStatus.NEW, start, end, null, null);

        when(projectRepository.save(any(Project.class))).thenReturn(saved);
        when(mapper.toDTO(saved)).thenReturn(expected);

        ProjectResponse result = service.create(req);

        assertThat(result).isEqualTo(expected);
        verify(projectRepository).save(argThat(p
                -> p.getName().equals("Alpha")
                && p.getDescription().equals("Desc")
                && p.getStatus() == ProjectStatus.NEW
                && p.getStartDate().equals(start)
                && p.getEndDate().equals(end)
        ));
    }

    @Nested
    @DisplayName("findAll()")
    class FindAll {

        @Test
        @DisplayName("should call repository.findAll and map results")
        void findAll_mapsResults() {
            Pageable pageable = PageRequest.of(0, 5);

            Project p1 = Project.builder().id(10L).name("P1").description("D1").status(ProjectStatus.NEW).build();
            Project p2 = Project.builder().id(20L).name("P2").description("D2").status(ProjectStatus.IN_PROGRESS).build();

            ProjectResponse r1 = new ProjectResponse(10L, "P1", "D1", ProjectStatus.NEW, null, null, null, null);
            ProjectResponse r2 = new ProjectResponse(20L, "P2", "D2", ProjectStatus.IN_PROGRESS, null, null, null, null);

            when(projectRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(p1, p2)));
            when(mapper.toDTO(p1)).thenReturn(r1);
            when(mapper.toDTO(p2)).thenReturn(r2);

            Page<ProjectResponse> page = service.findAll(pageable);

            assertThat(page.getTotalElements()).isEqualTo(2L);
            assertThat(page.getContent()).contains(r1, r2);
            verify(projectRepository).findAll(pageable);
        }
    }

    @Nested
    @DisplayName("findById()")
    class FindById {

        @Test
        @DisplayName("should return mapped dto when project exists")
        void findById_exists_returnsDto() {
            Project p = Project.builder().id(42L).name("Proj").description("Desc").status(ProjectStatus.NEW).build();
            ProjectResponse expected = new ProjectResponse(42L, "Proj", "Desc", ProjectStatus.NEW, null, null, null, null);
            when(projectRepository.findById(42L)).thenReturn(Optional.of(p));
            when(mapper.toDTO(p)).thenReturn(expected);

            ProjectResponse result = service.findById(42L);

            assertThat(result).isEqualTo(expected);
            verify(projectRepository).findById(42L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when project missing")
        void findById_missing_throws() {
            when(projectRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(404L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("404");
            verify(projectRepository).findById(404L);
        }
    }

    @Nested
    @DisplayName("patch()")
    class Patch {

        @Test
        @DisplayName("should update non-null fields, trim name, and return mapped dto")
        void patch_updatesAndReturnsMapped() {
            LocalDate start = LocalDate.of(2025, 2, 1);
            LocalDate end = LocalDate.of(2025, 9, 30);

            Project existing = Project.builder()
                    .id(5L)
                    .name("Old")
                    .description("OldDesc")
                    .status(ProjectStatus.NEW)
                    .startDate(LocalDate.of(2025, 1, 1))
                    .endDate(LocalDate.of(2025, 12, 31))
                    .build();

            ProjectUpdateRequest req = new ProjectUpdateRequest("  New  ", "NewDesc", ProjectStatus.COMPLETED, start, end);
            ProjectResponse expected = new ProjectResponse(5L, "New", "NewDesc", ProjectStatus.COMPLETED, start, end, null, null);

            when(projectRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(mapper.toDTO(existing)).thenReturn(expected);

            ProjectResponse result = service.update(5L, req);

            assertThat(existing.getName()).isEqualTo("New");
            assertThat(existing.getDescription()).isEqualTo("NewDesc");
            assertThat(existing.getStatus()).isEqualTo(ProjectStatus.COMPLETED);
            assertThat(existing.getStartDate()).isEqualTo(start);
            assertThat(existing.getEndDate()).isEqualTo(end);
            assertThat(result).isEqualTo(expected);
            verify(projectRepository).findById(5L);
            verify(projectRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw when patching non-existent project")
        void patch_missing_throws() {
            when(projectRepository.findById(999L)).thenReturn(Optional.empty());

            ProjectUpdateRequest req = new ProjectUpdateRequest("A", null, null, null, null);

            assertThatThrownBy(() -> service.update(999L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
            verify(projectRepository).findById(999L);
        }
    }

    @Nested
    @DisplayName("deleteById()")
    class DeleteById {

        @Test
        @DisplayName("should delete when project exists")
        void delete_exists_deletes() {
            when(projectRepository.existsById(7L)).thenReturn(true);

            service.deleteById(7L);

            verify(projectRepository).existsById(7L);
            verify(projectRepository).deleteById(7L);
        }

        @Test
        @DisplayName("should throw and not delete when project missing")
        void delete_missing_throws() {
            when(projectRepository.existsById(8L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteById(8L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("8");
            verify(projectRepository).existsById(8L);
            verify(projectRepository, never()).deleteById(any());
        }
    }
}
