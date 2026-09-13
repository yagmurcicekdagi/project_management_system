package com.example.project_management_system.entities;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "task_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "task_id", "employee_id" })
})
// TODO: If we prefer at most one asssignee for a task, then add UNIQUE(task_id)
public class TaskAssignment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "task_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Task task;

  @ManyToOne(optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Employee employee;

  // This is an id
  @Column(name = "assigned_by")
  private Long  assignedBy;

}
