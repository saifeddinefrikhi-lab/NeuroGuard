package com.neuroguard.userservice.services;

import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KeycloakService {

    private final RestTemplate restTemplate;

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.admin-client-id}")
    private String adminClientId;

    @Value("${keycloak.admin-username}")
    private String adminUsername;

    @Value("${keycloak.admin-password}")
    private String adminPassword;

    public String login(String username, String password) {
        String tokenUrl = tokenUrl();

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        form.add("username", username);
        form.add("password", password);
        form.add("scope", "openid profile email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, new HttpEntity<>(form, headers), Map.class);
        Object accessToken = response.getBody() != null ? response.getBody().get("access_token") : null;
        if (accessToken == null) {
            throw new IllegalStateException("Keycloak did not return an access token");
        }

        return accessToken.toString();
    }

    public void createOrUpdateUser(User user, String rawPassword) {
        String adminToken = getAdminToken();
        String existingId = findUserIdByUsername(adminToken, user.getUsername());
        if (existingId != null) {
            updateUser(adminToken, existingId, user, rawPassword);
            return;
        }

        String createdId = createUser(adminToken, user, rawPassword);
        assignRealmRole(adminToken, createdId, user.getRole());
    }

    private String createUser(String adminToken, User user, String rawPassword) {
        String createUrl = adminUsersUrl();

        HttpHeaders headers = bearerHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "enabled", true,
                "emailVerified", true,
                "attributes", Map.of("userId", List.of(String.valueOf(user.getId()))),
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", rawPassword,
                        "temporary", false
                ))
        );

        ResponseEntity<Void> response = restTemplate.postForEntity(createUrl, new HttpEntity<>(payload, headers), Void.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Failed to create Keycloak user");
        }

        String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
        if (location != null && !location.isBlank()) {
            return location.substring(location.lastIndexOf('/') + 1);
        }

        String lookedUp = findUserIdByUsername(adminToken, user.getUsername());
        if (lookedUp == null) {
            throw new IllegalStateException("Keycloak user was created but could not be resolved");
        }
        return lookedUp;
    }

    private void updateUser(String adminToken, String keycloakUserId, User user, String rawPassword) {
        HttpHeaders headers = bearerHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "id", keycloakUserId,
                "username", user.getUsername(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "enabled", true,
                "emailVerified", true,
                "attributes", Map.of("userId", List.of(String.valueOf(user.getId())))
        );

        restTemplate.exchange(
            adminUsersUrl() + "/" + keycloakUserId,
            org.springframework.http.HttpMethod.PUT,
            new HttpEntity<>(payload, headers),
            Void.class);

        Map<String, Object> credential = Map.of(
                "type", "password",
                "value", rawPassword,
                "temporary", false
        );
        restTemplate.exchange(
            adminUsersUrl() + "/" + keycloakUserId + "/reset-password",
            org.springframework.http.HttpMethod.PUT,
            new HttpEntity<>(credential, headers),
            Void.class);
        assignRealmRole(adminToken, keycloakUserId, user.getRole());
    }

    private void assignRealmRole(String adminToken, String keycloakUserId, Role role) {
        HttpHeaders headers = bearerHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        RoleRepresentation roleRepresentation = restTemplate.getForObject(adminRolesUrl(role.name()), RoleRepresentation.class);
        if (roleRepresentation == null) {
            throw new IllegalStateException("Keycloak role not found: " + role.name());
        }

        restTemplate.postForEntity(adminUsersUrl() + "/" + keycloakUserId + "/role-mappings/realm",
                new HttpEntity<>(List.of(roleRepresentation), headers), Void.class);
    }

    private String getAdminToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", adminClientId);
        form.add("username", adminUsername);
        form.add("password", adminPassword);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl(), new HttpEntity<>(form, headers), Map.class);
        Object accessToken = response.getBody() != null ? response.getBody().get("access_token") : null;
        if (accessToken == null) {
            throw new IllegalStateException("Failed to obtain Keycloak admin token");
        }

        return accessToken.toString();
    }

    private String findUserIdByUsername(String adminToken, String username) {
        HttpHeaders headers = bearerHeaders(adminToken);
        ResponseEntity<KeycloakUserRepresentation[]> response = restTemplate.exchange(
                adminUsersUrl() + "?username=" + username,
                org.springframework.http.HttpMethod.GET,
                new HttpEntity<>(headers),
                KeycloakUserRepresentation[].class);

        if (response.getBody() == null || response.getBody().length == 0) {
            return null;
        }

        return response.getBody()[0].id;
    }

    private HttpHeaders bearerHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private String tokenUrl() {
        return authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    private String adminUsersUrl() {
        return authServerUrl + "/admin/realms/" + realm + "/users";
    }

    private String adminRolesUrl(String roleName) {
        return authServerUrl + "/admin/realms/" + realm + "/roles/" + roleName;
    }

    private static class KeycloakUserRepresentation {
        public String id;
        public String username;
    }

    private static class RoleRepresentation {
        public String id;
        public String name;
    }
}