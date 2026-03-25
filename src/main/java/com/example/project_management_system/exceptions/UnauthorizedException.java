package com.example.project_management_system.exceptions;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public static UnauthorizedException invalidCredentials() {
        return new UnauthorizedException("Invalid email or password");
    }

    public static UnauthorizedException userNotFound() {
        return new UnauthorizedException("User not found");
    }

    public static UnauthorizedException unauthorized() {
        return new UnauthorizedException("Unauthorized");
    }

    public static UnauthorizedException wrongPassword() {
        return new UnauthorizedException("Current password is incorrect");
    }
}
