package com.example.project_management_system.controllers;

import java.util.List;

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
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.project_management_system.config.SecurityConfig;
import com.example.project_management_system.dtos.EmployeeResponse;
import com.example.project_management_system.dtos.ErrorResponse;
import com.example.project_management_system.dtos.ProjectAssignmentCreateRequest;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.services.EmployeeService;
import com.example.project_management_system.services.ProjectAssignmentService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(ProjectAssignmentController.class)
@Import(SecurityConfig.class)
@DisplayName("ProjectAssignmentController Slice Tests")
class ProjectAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectAssignmentService assignmentService;

    @MockitoBean
    private EmployeeService employeeService;

    private static final String BASE_URL = "/api/v1/projects";

    @Nested
    @DisplayName("POST /api/v1/projects/{projectId}/assignments")
    class CreateAssignment {

        @Test
        @DisplayName("should assign employee and return 201 with the location header")
        void shouldAssignEmployee() throws Exception {
            // Arrange
            long projectId = 1L;
            long employeeId = 2L;
            long assignedBy = 10L;
            EmployeeResponse response = new EmployeeResponse(employeeId, "Jane", "Doe");

            willDoNothing().given(assignmentService).addEmployeeToProject(projectId, employeeId, assignedBy);
            given(employeeService.findById(employeeId)).willReturn(response);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/" + projectId + "/assignments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"employeeId": 2, "assignedBy": 10}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(header().exists("Location"))
                    .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/api/v1/projects/1/assignments/2")))
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 400 when employeeId is missing")
        void shouldReturn400WhenEmployeeIdMissing() throws Exception {
            mockMvc.perform(post(BASE_URL + "/1/assignments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"assignedBy": 10}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.employeeId").value("employeeId is required"));
        }

        @Test
        @DisplayName("should return 404 when project not found")
        void shouldReturn404WhenProjectNotFound() throws Exception {
            willThrow(new ResourceNotFoundException("Project not found with id: 999"))
                    .given(assignmentService).addEmployeeToProject(eq(999L), eq(2L), any());

            ErrorResponse expected = new ErrorResponse(404, "Not Found",
                    "Project not found with id: 999", "/api/v1/projects/999/assignments");

            mockMvc.perform(post(BASE_URL + "/999/assignments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"employeeId": 2, "assignedBy": 10}
                                    """))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expected)));
        }

        @Test
        @DisplayName("should return 404 when employee not found")
        void shouldReturn404WhenEmployeeNotFound() throws Exception {
            willThrow(new ResourceNotFoundException("Employee not found with id: 999"))
                    .given(assignmentService).addEmployeeToProject(eq(1L), eq(999L), any());

            ErrorResponse expected = new ErrorResponse(404, "Not Found",
                    "Employee not found with id: 999", "/api/v1/projects/1/assignments");

            mockMvc.perform(post(BASE_URL + "/1/assignments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"employeeId": 999, "assignedBy": 10}
                                    """))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expected)));
        }

        @Test
        @DisplayName("should return 409 when employee already assigned")
        void shouldReturn409WhenAlreadyAssigned() throws Exception {
            willThrow(new ConflictException("Employee already assigned to this project"))
                    .given(assignmentService).addEmployeeToProject(eq(1L), eq(2L), any());

            ErrorResponse expected = new ErrorResponse(409, "Conflict",
                    "Employee already assigned to this project", "/api/v1/projects/1/assignments");

            mockMvc.perform(post(BASE_URL + "/1/assignments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"employeeId": 2, "assignedBy": 10}
                                    """))
                    .andExpect(status().isConflict())
                    .andExpect(content().json(objectMapper.writeValueAsString(expected)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/projects/{projectId}/assignments")
    class ListAssignments {

        @Test
        @DisplayName("should return list of employees in project")
        void shouldReturnListOfEmployees() throws Exception {
            List<EmployeeResponse> employees = List.of(
                    new EmployeeResponse(1L, "Jane", "Doe"),
                    new EmployeeResponse(2L, "John", "Smith"));
            given(assignmentService.listEmployeesInProject(1L)).willReturn(employees);

            mockMvc.perform(get(BASE_URL + "/1/assignments"))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(employees)));
        }

        @Test
        @DisplayName("should return empty list when no employees assigned")
        void shouldReturnEmptyList() throws Exception {
            given(assignmentService.listEmployeesInProject(1L)).willReturn(List.of());

            mockMvc.perform(get(BASE_URL + "/1/assignments"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));
        }

        @Test
        @DisplayName("should return 404 when project not found")
        void shouldReturn404WhenProjectNotFound() throws Exception {
            willThrow(new ResourceNotFoundException("Project not found with id: 999"))
                    .given(assignmentService).listEmployeesInProject(999L);

            ErrorResponse expected = new ErrorResponse(404, "Not Found",
                    "Project not found with id: 999", "/api/v1/projects/999/assignments");

            mockMvc.perform(get(BASE_URL + "/999/assignments"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expected)));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/projects/{projectId}/assignments/{employeeId}")
    class DeleteAssignment {

        @Test
        @DisplayName("should remove employee from project and return 204")
        void shouldRemoveEmployeeAndReturn204() throws Exception {
            willDoNothing().given(assignmentService).removeEmployeeFromProject(1L, 2L);

            mockMvc.perform(delete(BASE_URL + "/1/assignments/2"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 404 when assignment not found")
        void shouldReturn404WhenAssignmentNotFound() throws Exception {
            willThrow(new ResourceNotFoundException("Assignment not found for given project and employee"))
                    .given(assignmentService).removeEmployeeFromProject(1L, 999L);

            ErrorResponse expected = new ErrorResponse(404, "Not Found",
                    "Assignment not found for given project and employee", "/api/v1/projects/1/assignments/999");

            mockMvc.perform(delete(BASE_URL + "/1/assignments/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expected)));
        }
    }
}

