package com.example.project_management_system.controllers;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.project_management_system.dtos.ErrorResponse;
import com.example.project_management_system.dtos.project.ProjectCreateRequest;
import com.example.project_management_system.dtos.project.ProjectResponse;
import com.example.project_management_system.dtos.project.ProjectUpdateRequest;
import com.example.project_management_system.entities.ProjectStatus;
import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.services.EmployeeService;
import com.example.project_management_system.services.ProjectService;


@WebMvcTest(ProjectController.class)
@WithMockUser(authorities = "MANAGER")
@DisplayName("ProjectController Slice Tests")
class ProjectControllerTest extends BaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private EmployeeService employeeService;

    private static final String BASE_URL = "/api/v1/projects";

    @Nested
    @DisplayName("POST /api/v1/projects")
    class CreateProject {

        @Test
        @DisplayName("should create project and return 201 with the location header")
        void shouldCreateProject() throws Exception {
            ProjectResponse response = new ProjectResponse(1L, "Alpha", null, ProjectStatus.NEW,
                    null, null, Instant.now(), Instant.now());
            given(projectService.create(any(ProjectCreateRequest.class))).willReturn(response);

            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"name": "Alpha"}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(header().exists("Location"))
                    .andExpect(header().string("Location", containsString("/api/v1/projects/1")))
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void shouldReturn400WhenNameBlank() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"name": ""}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.name").value("Name is required"));
        }

        @Test
        @DisplayName("should return 400 when body is missing required fields")
        void shouldReturn400WhenBodyMissingFields() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.name").exists());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/projects")
    class FindAllProjects {

        @Test
        @DisplayName("should return paginated list of projects")
        void shouldReturnPaginatedList() throws Exception {
            List<ProjectResponse> projects = List.of(
                    new ProjectResponse(1L, "Alpha", "First", ProjectStatus.NEW,
                            LocalDate.of(2024, 1, 1), null, Instant.now(), Instant.now()),
                    new ProjectResponse(2L, "Beta", "Second", ProjectStatus.IN_PROGRESS,
                            LocalDate.of(2024, 2, 1), null, Instant.now(), Instant.now()));
            Page<ProjectResponse> page = new PageImpl<>(projects, PageRequest.of(0, 10), projects.size());
            given(projectService.findAll(any(Pageable.class))).willReturn(page);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.content[0].name").value("Alpha"))
                    .andExpect(jsonPath("$.content[1].name").value("Beta"));
        }

        @Test
        @DisplayName("should return empty page when no projects exist")
        void shouldReturnEmptyPage() throws Exception {
            Page<ProjectResponse> emptyPage = Page.empty();
            given(projectService.findAll(any(Pageable.class))).willReturn(emptyPage);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)))
                    .andExpect(jsonPath("$.page.totalElements").value(0));
        }

        @Test
        @DisplayName("should support pagination parameters")
        void shouldSupportPaginationParams() throws Exception {
            Page<ProjectResponse> page = Page.empty();
            given(projectService.findAll(any(Pageable.class))).willReturn(page);

            mockMvc.perform(get(BASE_URL)
                    .param("page", "1")
                    .param("size", "5")
                    .param("sort", "name,asc"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "jane@example.com", authorities = "USER")
        @DisplayName("should return only assigned projects for USER role")
        void shouldReturnAssignedProjectsForUser() throws Exception {
            Employee employee = new Employee();
            employee.setId(1L);

            List<ProjectResponse> projects = List.of(
                    new ProjectResponse(1L, "Alpha", null, ProjectStatus.NEW,
                            null, null, Instant.now(), Instant.now()));
            Page<ProjectResponse> page = new PageImpl<>(projects);

            given(employeeService.findByEmail("jane@example.com")).willReturn(employee);
            given(projectService.findByEmployee(eq(1L), any(Pageable.class))).willReturn(page);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].name").value("Alpha"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/projects/{id}")
    class FindProjectById {

        @Test
        @DisplayName("should return project when found")
        void shouldReturnProjectWhenFound() throws Exception {
            ProjectResponse response = new ProjectResponse(1L, "Alpha", null, ProjectStatus.NEW,
                    null, null, Instant.now(), Instant.now());
            given(projectService.findById(1L)).willReturn(response);

            mockMvc.perform(get(BASE_URL + "/1"))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 404 when project not found")
        void shouldReturn404WhenNotFound() throws Exception {
            given(projectService.findById(999L))
                    .willThrow(ResourceNotFoundException.project(999L));
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found",
                    "Project not found with id: 999", "/api/v1/projects/999");

            mockMvc.perform(get(BASE_URL + "/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));
        }
    }

    @Nested
    class PatchProject {

        @Test
        @DisplayName("should update project and return 200")
        void shouldUpdateProject() throws Exception {
            ProjectResponse response = new ProjectResponse(1L, "Gamma", null, ProjectStatus.NEW,
                    null, null, Instant.now(), Instant.now());
            given(projectService.update(eq(1L), any(ProjectUpdateRequest.class))).willReturn(response);

            mockMvc.perform(patch(BASE_URL + "/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"name": "Gamma"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 404 when patching non-existent project")
        void shouldReturn404WhenPatchingNonExistent() throws Exception {
            given(projectService.update(eq(999L), any(ProjectUpdateRequest.class)))
                    .willThrow(ResourceNotFoundException.project(999L));
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found",
                    "Project not found with id: 999", "/api/v1/projects/999");

            mockMvc.perform(patch(BASE_URL + "/999")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"name": "Gamma"}
                                    """))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/projects/{id}")
    class DeleteProject {

        @Test
        @DisplayName("should delete project and return 204")
        void shouldDeleteProjectAndReturn204() throws Exception {
            willDoNothing().given(projectService).deleteById(1L);

            mockMvc.perform(delete(BASE_URL + "/1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 404 when deleting non-existent project")
        void shouldReturn404WhenDeletingNonExistent() throws Exception {
            willThrow(ResourceNotFoundException.project(999L))
                    .given(projectService).deleteById(999L);
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found",
                    "Project not found with id: 999", "/api/v1/projects/999");

            mockMvc.perform(delete(BASE_URL + "/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));
        }
    }
}

