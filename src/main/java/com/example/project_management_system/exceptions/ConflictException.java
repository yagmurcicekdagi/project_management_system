package com.example.project_management_system.exceptions;

public class ConflictException extends RuntimeException {
  public ConflictException(String message){
    super(message);
  }
}
