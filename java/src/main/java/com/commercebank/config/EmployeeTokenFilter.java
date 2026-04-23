package com.commercebank.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Validates the Bearer token sent by the React front-end after employee login.
 * The token is the SHA-256 hash of the password (matching employeeAuth.ts).
 * The role (staff | admin) is embedded as a claim in the principal name.
 */
public class EmployeeTokenFilter extends OncePerRequestFilter {

    private final AppProperties props;

    public EmployeeTokenFilter(AppProperties props) {
        this.props = props;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            String role = resolveRole(token);
            if (role != null) {
                var auth = new UsernamePasswordAuthenticationToken(
                        role, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }

    private String resolveRole(String hash) {
        if (hash.equals(props.auth().adminHash())) return "admin";
        if (hash.equals(props.auth().staffHash())) return "staff";
        return null;
    }
}
