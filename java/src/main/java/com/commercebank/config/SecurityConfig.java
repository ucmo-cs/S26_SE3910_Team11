package com.commercebank.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final AppProperties props;

    public SecurityConfig(AppProperties props) {
        this.props = props;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(c -> c.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public booking endpoints
                .requestMatchers(HttpMethod.GET,  "/api/topics").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/branches").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/appointments/slots").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/appointments").permitAll()
                // Chat assistant (public)
                .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()
                // Employee auth
                .requestMatchers(HttpMethod.POST, "/api/employee/login").permitAll()
                // All admin endpoints require the employee role (enforced in service)
                .requestMatchers("/api/admin/**").authenticated()
                .anyRequest().authenticated()
            )
            // Our own token filter handles authentication; disable form login
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);

        // Register the session-token filter
        http.addFilterBefore(
                new EmployeeTokenFilter(props),
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(props.cors().allowedOrigins());
        cfg.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
