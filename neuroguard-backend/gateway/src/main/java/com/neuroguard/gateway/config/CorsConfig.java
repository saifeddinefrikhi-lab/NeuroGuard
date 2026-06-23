package com.neuroguard.gateway.config;

/**
 * CorsConfig intentionally left empty.
 *
 * CORS is handled in two places that are already consistent:
 *  1. SecurityConfig.corsConfigurationSource() — wired into the Security filter chain via .cors(withDefaults())
 *  2. gateway-routes.yml globalcors block
 *
 * A third CorsWebFilter bean here was causing duplicate Access-Control-Allow-Origin headers
 * ("http://localhost:4200, *") which browsers refuse, producing CORS errors on every API call
 * and WebSocket upgrade. Removing the bean resolves this.
 */
public class CorsConfig {
    // intentionally empty — see Javadoc above
}

