using './main.bicep'

param environmentName = readEnvironmentVariable('AZURE_ENV_NAME', 'snaktocat')
param location = readEnvironmentVariable('AZURE_LOCATION', 'swedencentral')
param adminPassword = readEnvironmentVariable('ADMIN_PASSWORD', '')
param pgAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD', '')
param pgAdminLogin = 'pgadmin'
param allowedIp = readEnvironmentVariable('ALLOWED_IP', '')
