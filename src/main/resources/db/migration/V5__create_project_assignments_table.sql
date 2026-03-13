CREATE TABLE project_assignments (
    id          BIGSERIAL   PRIMARY KEY,
    project_id  BIGINT      NOT NULL,
    employee_id BIGINT      NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL,
    assigned_by BIGINT,
    CONSTRAINT uq_project_assignments UNIQUE (project_id, employee_id),
    CONSTRAINT fk_pa_project  FOREIGN KEY (project_id)  REFERENCES projects(id)  ON DELETE CASCADE,
    CONSTRAINT fk_pa_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
