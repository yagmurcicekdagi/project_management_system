package com.example.project_management_system.controllers;

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
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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

import com.example.project_management_system.config.SecurityConfig;
import com.example.project_management_system.dtos.EmployeeCreateRequest;
import com.example.project_management_system.dtos.EmployeeResponse;
import com.example.project_management_system.dtos.EmployeeUpdateRequest;
import com.example.project_management_system.dtos.ErrorResponse;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.services.EmployeeService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(EmployeeController.class)
@Import(SecurityConfig.class)
@DisplayName("EmployeeController Slice Tests")
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmployeeService employeeService;

    private static final String BASE_URL = "/api/v1/employees";

    @Nested
    @DisplayName("POST /api/v1/employees")
    class CreateEmployee {

        @Test
        @DisplayName("should create employee and return 201 with the location header")
        void shouldCreateEmployee() throws Exception {
            EmployeeResponse response = new EmployeeResponse(1L, "Jane", "Doe");
            given(employeeService.create(any(EmployeeCreateRequest.class))).willReturn(response);

            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Jane", "lastName": "Doe"}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(header().exists("Location"))
                    .andExpect(header().string("Location", containsString("/api/v1/employees/1")))
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 400 when firstName is blank")
        void shouldReturn400WhenFirstNameBlank() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "", "lastName": "Doe"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.firstName").value("First name is required"));
        }

        @Test
        @DisplayName("should return 400 when lastName is blank")
        void shouldReturn400WhenLastNameBlank() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Jane", "lastName": ""}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.lastName").value("Last name is required"));
        }

        @Test
        @DisplayName("should return 400 when body is missing required fields")
        void shouldReturn400WhenBodyMissingFields() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.firstName").exists())
                    .andExpect(jsonPath("$.lastName").exists());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees")
    class FindAllEmployees {

        @Test
        @DisplayName("should return paginated list of employees")
        void shouldReturnPaginatedList() throws Exception {
            // Arrange
            List<EmployeeResponse> employees = List.of(
                    new EmployeeResponse(1L, "Jane", "Doe"),
                    new EmployeeResponse(2L, "John", "Smith"));
            Page<EmployeeResponse> page = new PageImpl<>(employees);
            given(employeeService.findAll(any(), any(Pageable.class))).willReturn(page);

            String expectedJson = objectMapper.writeValueAsString(page);
            // Act & Assert
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(content().json(expectedJson));
        }

        @Test
        @DisplayName("should return empty page when no employees exist")
        void shouldReturnEmptyPage() throws Exception {
            Page<EmployeeResponse> emptyPage = Page.empty();
            given(employeeService.findAll(any(), any(Pageable.class))).willReturn(emptyPage);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)))
                    .andExpect(jsonPath("$.page.totalElements").value(0));
        }

        @Test
        @DisplayName("should pass search parameter to service")
        void shouldPassSearchParam() throws Exception {
            Page<EmployeeResponse> page = new PageImpl<>(
                    List.of(new EmployeeResponse(1L, "Jane", "Doe")));
            given(employeeService.findAll(eq("Jane"), any(Pageable.class))).willReturn(page);

            mockMvc.perform(get(BASE_URL).param("search", "Jane"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].firstName").value("Jane"));
        }

        @Test
        @DisplayName("should support pagination parameters")
        void shouldSupportPaginationParams() throws Exception {
            Page<EmployeeResponse> page = Page.empty();
            given(employeeService.findAll(any(), any(Pageable.class))).willReturn(page);

            mockMvc.perform(get(BASE_URL)
                    .param("page", "1")
                    .param("size", "5")
                    .param("sort", "firstName,asc"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees/{id}")
    class FindEmployeeById {

        @Test
        @DisplayName("should return employee when found")
        void shouldReturnEmployeeWhenFound() throws Exception {
            EmployeeResponse response = new EmployeeResponse(1L, "Jane", "Doe");
            given(employeeService.findById(1L)).willReturn(response);

            mockMvc.perform(get(BASE_URL + "/1"))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 404 when employee not found")
        void shouldReturn404WhenNotFound() throws Exception {
            given(employeeService.findById(999L))
                    .willThrow(new ResourceNotFoundException("Employee not found with id: 999"));
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found", "Employee not found with id: 999", "/api/v1/employees/999");

            mockMvc.perform(get(BASE_URL + "/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));

        }
    }

    @Nested
    class PatchEmployee {

        @Test
        @DisplayName("should update employee and return 200")
        void shouldUpdateEmployee() throws Exception {
            EmployeeResponse response = new EmployeeResponse(1L, "Janet", "Doe");
            given(employeeService.patch(eq(1L), any(EmployeeUpdateRequest.class))).willReturn(response);

            mockMvc.perform(patch(BASE_URL + "/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Janet"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 404 when patching non-existent employee")
        void shouldReturn404WhenPatchingNonExistent() throws Exception {
            given(employeeService.patch(eq(999L), any(EmployeeUpdateRequest.class)))
                    .willThrow(new ResourceNotFoundException("Employee not found with id: 999"));
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found", "Employee not found with id: 999", "/api/v1/employees/999");

            mockMvc.perform(patch(BASE_URL + "/999")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Janet"}
                                    """))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));

        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/employees/{id}")
    class DeleteEmployee {

        @Test
        @DisplayName("should delete employee and return 204")
        void shouldDeleteEmployeeAndReturn204() throws Exception {
            willDoNothing().given(employeeService).deleteById(1L);

            mockMvc.perform(delete(BASE_URL + "/1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 404 when deleting non-existent employee")
        void shouldReturn404WhenDeletingNonExistent() throws Exception {
            willThrow(new ResourceNotFoundException("Employee not found with id: 999"))
                    .given(employeeService).deleteById(999L);
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found", "Employee not found with id: 999", "/api/v1/employees/999");

            mockMvc.perform(delete(BASE_URL + "/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));
        }
    }

}
