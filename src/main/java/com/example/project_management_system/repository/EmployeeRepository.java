

package com.example.project_management_system.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project_management_system.entities.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    Page<Employee> findByFirstNameStartingWithIgnoreCaseOrLastNameStartingWithIgnoreCase(
            String firstName,
            String lastName,
            Pageable pageable);
}
