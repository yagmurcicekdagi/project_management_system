package com.example.project_management_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project_management_system.entities.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Page<Employee> findByFirstNameStartingWithIgnoreCaseOrLastNameStartingWithIgnoreCase(
            String firstName, String lastName, Pageable pageable);
}
