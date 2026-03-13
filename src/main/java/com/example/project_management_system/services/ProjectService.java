package com.example.project_management_system.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_management_system.dtos.project.ProjectCreateRequest;
import com.example.project_management_system.dtos.project.ProjectResponse;
import com.example.project_management_system.dtos.project.ProjectUpdateRequest;
import com.example.project_management_system.entities.Project;
import com.example.project_management_system.entities.ProjectStatus;
import com.example.project_management_system.exceptions.ResourceNotFoundException;
import com.example.project_management_system.mappers.ProjectMapper;
import com.example.project_management_system.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMapper mapper;

    @Transactional
    public ProjectResponse create(ProjectCreateRequest req) {
        Project project = new Project();

        project.setName(req.name());
        project.setDescription(req.description());
        project.setStatus(req.status() != null ? req.status() : ProjectStatus.NEW);
        project.setStartDate(req.startDate());
        project.setEndDate(req.endDate());

        Project saved = projectRepository.save(project);
        return mapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> findAll(Pageable pageable) {
        return projectRepository.findAll(pageable).map(mapper::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> findByEmployee(Long employeeId, Pageable pageable) {
        return projectRepository.findByEmployeeId(employeeId, pageable).map(mapper::toDTO);
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(Long id) {
        return projectRepository.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

    }

    @Transactional
    public ProjectResponse patch(Long id, ProjectUpdateRequest req) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (req.name() != null) {
            p.setName(req.name().trim());
        }

        if (req.description() != null) {
            p.setDescription(req.description());
        }

        if (req.status() != null) {
            p.setStatus(req.status());
        }

        if (req.startDate() != null) {
            p.setStartDate(req.startDate());
        }

        if (req.endDate() != null) {
            p.setEndDate(req.endDate());
        }

        return mapper.toDTO(p);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }
}
