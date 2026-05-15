@description('Primary location')
param location string

@description('Resource tags')
param tags object

@description('Unique suffix for resource names')
param resourceToken string

@description('Private endpoint subnet ID')
param peSubnetId string

@description('Private DNS zone ID for Key Vault')
param kvDnsZoneId string

@description('Managed identity principal ID for RBAC')
param managedIdentityPrincipalId string

@description('Allowed public IP for management access')
param allowedIp string

@description('PostgreSQL server FQDN')
param pgServerFqdn string

@description('PostgreSQL admin login')
param pgAdminLogin string

@secure()
@description('PostgreSQL admin password')
param pgAdminPassword string

@secure()
@description('Admin password for the app')
param adminPassword string

@description('Log Analytics workspace ID for diagnostics')
param logAnalyticsWorkspaceId string

var databaseUrl = 'postgresql://${pgAdminLogin}:${pgAdminPassword}@${pgServerFqdn}:5432/snaktocat?sslmode=require'

resource keyVault 'Microsoft.KeyVault/vaults@2024-04-01-preview' = {
  name: 'kv-snake-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: [
        {
          value: allowedIp
        }
      ]
    }
  }

  resource kvSecretDbUrl 'secrets' = {
    name: 'database-url'
    properties: {
      value: databaseUrl
    }
  }

  resource kvSecretAdminPassword 'secrets' = {
    name: 'admin-password'
    properties: {
      value: adminPassword
    }
  }
}

resource kvPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {
  name: 'pe-kv-${resourceToken}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: peSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'kv-connection'
        properties: {
          privateLinkServiceId: keyVault.id
          groupIds: ['vault']
        }
      }
    ]
  }

  resource kvPeDnsGroup 'privateDnsZoneGroups' = {
    name: 'default'
    properties: {
      privateDnsZoneConfigs: [
        {
          name: 'kv-dns'
          properties: {
            privateDnsZoneId: kvDnsZoneId
          }
        }
      ]
    }
  }
}

// RBAC: Key Vault Secrets User for Managed Identity
resource kvSecretsRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('kv-snake-${resourceToken}', managedIdentityPrincipalId, 'kvsecrets')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource kvDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'kv-diagnostics'
  scope: keyVault
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

output keyVaultName string = keyVault.name
output dbUrlSecretUri string = keyVault::kvSecretDbUrl.properties.secretUri
#disable-next-line outputs-should-not-contain-secrets
output adminPasswordSecretUri string = keyVault::kvSecretAdminPassword.properties.secretUri
