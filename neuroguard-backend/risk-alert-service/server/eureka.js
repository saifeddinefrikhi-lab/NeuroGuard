import { Eureka } from 'eureka-js-client';

/**
 * Eureka client compatible with Spring Cloud Netflix Eureka Server.
 * See eureka-js-client README "400 Bad Request" / "Usage with Spring Cloud".
 */
export function createEurekaClient(config) {
  const instanceHost = config.eurekaInstanceHost || 'localhost';
  const port = config.port;
  const baseUrl = `http://${instanceHost}:${port}`;

  return new Eureka({
    instance: {
      app: config.serviceName.toUpperCase(),
      instanceId: `${instanceHost}:${config.serviceName}:${port}`,
      hostName: instanceHost,
      ipAddr: instanceHost,
      status: 'UP',
      port: {
        $: port,
        '@enabled': 'true'
      },
      securePort: {
        $: 443,
        '@enabled': 'false'
      },
      vipAddress: config.serviceName.toLowerCase(),
      secureVipAddress: config.serviceName.toLowerCase(),
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn'
      },
      statusPageUrl: `${baseUrl}/health`,
      healthCheckUrl: `${baseUrl}/health`,
      homePageUrl: baseUrl,
      leaseRenewalIntervalInSeconds: 10,
      leaseExpirationDurationInSeconds: 30
    },
    eureka: {
      host: config.eurekaHost,
      port: config.eurekaPort,
      servicePath: '/eureka/apps/',
      maxRetries: 10,
      requestRetryDelay: 2000
    }
  });
}
