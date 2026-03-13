package com.example.project_management_system.config;

import java.util.Arrays;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Bean
    Flyway flyway(DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();
        flyway.migrate();
        return flyway;
    }

    /**
     * Ensures Flyway migrations run before Hibernate schema validation.
     * Required because Spring Boot 4 removed FlywayAutoConfiguration.
     */
    @Bean
    static BeanFactoryPostProcessor flywayJpaDependencyPostProcessor() {
        return beanFactory -> {
            if (!(beanFactory instanceof DefaultListableBeanFactory dlbf)) return;
            if (!dlbf.containsBeanDefinition("entityManagerFactory")) return;

            BeanDefinition def = dlbf.getBeanDefinition("entityManagerFactory");
            String[] existing = def.getDependsOn();
            String[] updated = existing == null
                    ? new String[]{"flyway"}
                    : Arrays.copyOf(existing, existing.length + 1);
            updated[updated.length - 1] = "flyway";
            def.setDependsOn(updated);
        };
    }
}
