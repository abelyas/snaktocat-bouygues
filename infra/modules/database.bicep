@description('Primary location')
param location string

@description('Resource tags')
param tags object

@description('Unique suffix for resource names')
param resourceToken string

@description('PostgreSQL admin login')
param pgAdminLogin string

@secure()
@description('PostgreSQL admin password')
param pgAdminPassword string

@description('Delegated subnet ID for PostgreSQL')
param pgSubnetId string

@description('Private DNS zone ID for PostgreSQL')
param pgDnsZoneId string

@description('Log Analytics workspace ID for diagnostics')
param logAnalyticsWorkspaceId string

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: 'pg-snake-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: pgAdminLogin
    administratorLoginPassword: pgAdminPassword
    version: '16'
    storage: {
      storageSizeGB: 32
    }
    network: {
      delegatedSubnetResourceId: pgSubnetId
      privateDnsZoneArmResourceId: pgDnsZoneId
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }

  resource pgDatabase 'databases' = {
    name: 'snaktocat'
    properties: {
      charset: 'UTF8'
      collation: 'en_US.utf8'
    }
  }
}

resource pgDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'pg-diagnostics'
  scope: pgServer
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output serverFqdn string = pgServer.properties.fullyQualifiedDomainName
output databaseName string = pgServer::pgDatabase.name
