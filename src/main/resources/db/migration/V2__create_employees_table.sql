CREATE TABLE employees (
    id         BIGSERIAL    PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name  VARCHAR(255) NOT NULL,
    user_id    BIGINT       UNIQUE,
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id)
);
