package com.example.project_management_system.integration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.project_management_system.entities.User;

import com.example.project_management_system.entities.Employee;
import com.example.project_management_system.repository.EmployeeRepository;
import com.example.project_management_system.repository.UserRepository;
import com.example.project_management_system.services.EmployeeService;

class EmployeeIntegrationTest extends DatabaseIntegrationTest {
  @Autowired
  EmployeeService employeeService;
  @Autowired
  EmployeeRepository employeeRepository;
  @Autowired
  UserRepository userRepository;

  @Test
  void deleteById_removesUserFromDb() {
    // Create and save the user - mail could be different for the account
    User user = User.builder().email("janedoe@gmail.com").passwordHash("p").role("USER").build();
    userRepository.save(user);

    // Create and save the employee which has a link to user
    Employee employee = Employee.builder().email("jane@gmail.com").firstName("Jane").lastName("Doe").user(user).build();
    employeeRepository.save(employee);

    // Call the method
    employeeService.deleteById(employee.getId());

    // Assert user is deleted from db
    assertFalse(employeeRepository.existsById(employee.getId()));
    assertFalse(userRepository.existsById(user.getId()));

  }

}
