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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
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
import com.example.project_management_system.dtos.employee.EmployeeCreateRequest;
import com.example.project_management_system.dtos.employee.EmployeeResponse;
import com.example.project_management_system.dtos.employee.EmployeeUpdateRequest;
import com.example.project_management_system.exceptions.ConflictException;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.services.EmployeeService;

@WebMvcTest(EmployeeController.class)
@DisplayName("EmployeeController Slice Tests")
@WithMockUser(authorities = "MANAGER")
class EmployeeControllerTest extends BaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String BASE_URL = "/api/v1/employees";

    @MockitoBean
    private EmployeeService employeeService;

    @Nested
    @DisplayName("POST /api/v1/employees")
    class CreateEmployee {

        @Test
        @DisplayName("should create employee and return 201 with the location header")
        void shouldCreateEmployee() throws Exception {
            EmployeeResponse response = new EmployeeResponse(1L, "Jane", "Doe", "jane@example.com", null);
            given(employeeService.create(any(EmployeeCreateRequest.class))).willReturn(response);

            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Jane", "lastName": "Doe", "email": "jane@example.com"}
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
                                    {"firstName": "", "lastName": "Doe", "email": "jane@example.com"}
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
                                    {"firstName": "Jane", "lastName": "", "email": "jane@example.com"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.lastName").value("Last name is required"));
        }

        @Test
        @DisplayName("should return 400 when email is missing")
        void shouldReturn400WhenEmailMissing() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Jane", "lastName": "Doe"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.email").exists());
        }

        @Test
        @DisplayName("should return 400 when email format is invalid")
        void shouldReturn400WhenEmailInvalid() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Jane", "lastName": "Doe", "email": "not-an-email"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.email").value("Email must be valid"));
        }

        @Test
        @DisplayName("should return 409 when email is already provisioned")
        void shouldReturn409WhenEmailConflict() throws Exception {
            given(employeeService.create(any(EmployeeCreateRequest.class)))
                    .willThrow(ConflictException.employeeEmailExists());

            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                                    {"firstName": "Jane", "lastName": "Doe", "email": "jane@example.com"}
                                    """))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("An employee with this email already exists"));
        }

        @Test
        @DisplayName("should return 400 when body is missing required fields")
        void shouldReturn400WhenBodyMissingFields() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.firstName").exists())
                    .andExpect(jsonPath("$.lastName").exists())
                    .andExpect(jsonPath("$.email").exists());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees")
    class FindAllEmployees {

        @Test
        @DisplayName("should return paginated list of employees")
        void shouldReturnPaginatedList() throws Exception {
            List<EmployeeResponse> employees = List.of(
                    new EmployeeResponse(1L, "Jane", "Doe", "jane@example.com", null),
                    new EmployeeResponse(2L, "John", "Smith", "john@example.com", null));
            Page<EmployeeResponse> page = new PageImpl<>(employees);
            given(employeeService.findAll(any(), any(Pageable.class))).willReturn(page);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.content[0].firstName").value("Jane"))
                    .andExpect(jsonPath("$.content[1].firstName").value("John"));
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
                    List.of(new EmployeeResponse(1L, "Jane", "Doe", "jane@example.com", null)));
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
            EmployeeResponse response = new EmployeeResponse(1L, "Jane", "Doe", "jane@example.com", null);
            given(employeeService.findById(1L)).willReturn(response);

            mockMvc.perform(get(BASE_URL + "/1"))
                    .andExpect(status().isOk())
                    .andExpect(content().json(objectMapper.writeValueAsString(response)));
        }

        @Test
        @DisplayName("should return 404 when employee not found")
        void shouldReturn404WhenNotFound() throws Exception {
            given(employeeService.findById(999L))
                    .willThrow(ResourceNotFoundException.employee(999L));
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found", "Employee not found with id: 999", "/api/v1/employees/999");

            mockMvc.perform(get(BASE_URL + "/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/employees/{id}")
    class PatchEmployee {

        @Test
        @DisplayName("should update employee and return 200")
        void shouldUpdateEmployee() throws Exception {
            EmployeeResponse response = new EmployeeResponse(1L, "Janet", "Doe", "jane@example.com", null);
            given(employeeService.update(eq(1L), any(EmployeeUpdateRequest.class))).willReturn(response);

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
            given(employeeService.update(eq(999L), any(EmployeeUpdateRequest.class)))
                    .willThrow(ResourceNotFoundException.employee(999L));
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
            willThrow(ResourceNotFoundException.employee(999L))
                    .given(employeeService).deleteById(999L);
            ErrorResponse expectedError = new ErrorResponse(404, "Not Found", "Employee not found with id: 999", "/api/v1/employees/999");

            mockMvc.perform(delete(BASE_URL + "/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().json(objectMapper.writeValueAsString(expectedError)));
        }
    }

    @Nested
    @WithMockUser(authorities = "USER")
    @DisplayName("Access control — non-MANAGER receives 403")
    class AccessControl {

        @Test
        @DisplayName("POST /api/v1/employees should return 403 for non-manager")
        void createShouldReturn403ForNonManager() throws Exception {
            mockMvc.perform(post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"firstName": "Jane", "lastName": "Doe", "email": "jane@example.com"}
                            """))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /api/v1/employees should return 403 for non-manager")
        void findAllShouldReturn403ForNonManager() throws Exception {
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /api/v1/employees/{id} should return 403 for non-manager")
        void findByIdShouldReturn403ForNonManager() throws Exception {
            mockMvc.perform(get(BASE_URL + "/1"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("PATCH /api/v1/employees/{id} should return 403 for non-manager")
        void patchShouldReturn403ForNonManager() throws Exception {
            mockMvc.perform(patch(BASE_URL + "/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"firstName": "Janet"}
                            """))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("DELETE /api/v1/employees/{id} should return 403 for non-manager")
        void deleteShouldReturn403ForNonManager() throws Exception {
            mockMvc.perform(delete(BASE_URL + "/1"))
                    .andExpect(status().isForbidden());
        }
    }

}
