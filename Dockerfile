# Stage 1: Build the application using JDK and Maven
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom.xml first to cache dependency downloads
COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
COPY pom.xml .

# Fix execute permission and download all dependencies (cached until pom.xml changes)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code separately so code changes don't re-download dependencies
COPY src src

# Build the fat JAR, skip tests (tests should run in CI)
RUN ./mvnw package -DskipTests -B

# Stage 2: Minimal runtime image with only the JRE (no compiler, no source code)
FROM eclipse-temurin:21-jre-alpine

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy only the built JAR from the builder stage, discard everything else
COPY --from=builder /build/target/*.jar app.jar

# Run as non-root user
USER spring

# Document the port the app listens on
EXPOSE 8080

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
