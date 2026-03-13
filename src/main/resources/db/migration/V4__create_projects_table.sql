CREATE TABLE projects (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(255) NOT NULL DEFAULT 'NEW',
    start_date  DATE,
    end_date    DATE,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT chk_projects_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'COMPLETED'))
);
