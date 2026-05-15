targetScope = 'resourceGroup'

@description('Name of the azd environment')
param environmentName string

@description('Primary location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceToken string = toLower(uniqueString(resourceGroup().id))

var tags = {
  'azd-env-name': environmentName
}

@secure()
@description('Admin password for the app')
param adminPassword string

@secure()
@description('PostgreSQL administrator password')
param pgAdminPassword string

@description('Allowed public IP for management access')
param allowedIp string

@description('PostgreSQL administrator login name')
param pgAdminLogin string = 'pgadmin'

// Managed Identity — used across modules
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-snake-${resourceToken}'
  location: location
  tags: tags
}

module monitoring 'modules/monitoring.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
  }
}

module network 'modules/network.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
  }
}

module database 'modules/database.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    pgAdminLogin: pgAdminLogin
    pgAdminPassword: pgAdminPassword
    pgSubnetId: network.outputs.pgSubnetId
    pgDnsZoneId: network.outputs.pgDnsZoneId
    logAnalyticsWorkspaceId: monitoring.outputs.workspaceId
  }
}

module registry 'modules/registry.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    peSubnetId: network.outputs.peSubnetId
    acrDnsZoneId: network.outputs.acrDnsZoneId
    managedIdentityPrincipalId: managedIdentity.properties.principalId
  }
}

module keyvault 'modules/keyvault.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    peSubnetId: network.outputs.peSubnetId
    kvDnsZoneId: network.outputs.kvDnsZoneId
    managedIdentityPrincipalId: managedIdentity.properties.principalId
    allowedIp: allowedIp
    pgServerFqdn: database.outputs.serverFqdn
    pgAdminLogin: pgAdminLogin
    pgAdminPassword: pgAdminPassword
    adminPassword: adminPassword
    logAnalyticsWorkspaceId: monitoring.outputs.workspaceId
  }
}

module containerApp 'modules/container-app.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    acaSubnetId: network.outputs.acaSubnetId
    logAnalyticsCustomerId: monitoring.outputs.workspaceCustomerId
    logAnalyticsSharedKey: monitoring.outputs.workspaceSharedKey
    managedIdentityId: managedIdentity.id
    acrLoginServer: registry.outputs.loginServer
    dbUrlSecretUri: keyvault.outputs.dbUrlSecretUri
    adminPasswordSecretUri: keyvault.outputs.adminPasswordSecretUri
  }
}

module frontdoor 'modules/frontdoor.bicep' = {
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    containerAppFqdn: containerApp.outputs.containerAppFqdn
    acaEnvironmentId: containerApp.outputs.environmentId
  }
}

// Outputs
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = registry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = registry.outputs.acrName
output acaEnvironmentDefaultDomain string = containerApp.outputs.environmentDefaultDomain
output frontDoorEndpointHostname string = frontdoor.outputs.endpointHostname
output frontDoorId string = frontdoor.outputs.frontDoorId
output keyVaultName string = keyvault.outputs.keyVaultName
output managedIdentityClientId string = managedIdentity.properties.clientId
output pgServerFqdn string = database.outputs.serverFqdn
output databaseName string = database.outputs.databaseName
