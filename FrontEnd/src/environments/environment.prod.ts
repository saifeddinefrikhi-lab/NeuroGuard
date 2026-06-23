import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'http://localhost:8083', // gateway URL (change in production)
  pharmacyApiUrl: 'http://localhost:8083', // Use gateway for CORS support (change in production)
  wsUrl: 'http://localhost:8089',
  carePlanWsUrl: 'http://localhost:8084',
  usersApi: 'http://localhost:8083/users',
  monitoringApi: 'http://localhost:8083/api/monitoring',
  wellbeingApi: 'http://localhost:8083/api/wellbeing',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'neuroguard',
    clientId: 'neuroguard-web'
  }
};
