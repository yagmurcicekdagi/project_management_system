package com.example.project_management_system.mappers;

import org.springframework.stereotype.Component;

import com.example.project_management_system.dtos.project.ProjectResponse;
import com.example.project_management_system.entities.Project;

@Component
public class ProjectMapper {

    public ProjectResponse toDTO(Project p) {
        return new ProjectResponse(p.getId(), p.getName(), p.getDescription(), p.getStatus(),
                p.getStartDate(), p.getEndDate(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
