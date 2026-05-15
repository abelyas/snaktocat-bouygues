@description('Primary location')
param location string

@description('Resource tags')
param tags object

@description('Unique suffix for resource names')
param resourceToken string

@description('Container Apps subnet ID')
param acaSubnetId string

@description('Log Analytics customer ID')
param logAnalyticsCustomerId string

@secure()
@description('Log Analytics shared key')
param logAnalyticsSharedKey string

@description('Managed Identity resource ID')
param managedIdentityId string

@description('ACR login server')
param acrLoginServer string

@description('Database URL secret URI in Key Vault')
param dbUrlSecretUri string

@description('Admin password secret URI in Key Vault')
param adminPasswordSecretUri string

resource acaEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'acaenv-snake-${resourceToken}'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: acaSubnetId
      internal: true
    }
  }
}

var containerAppName = 'snaktocat'

// external: true within an internal environment = reachable from VNet only
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: union(tags, { 'azd-service-name': 'web' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: acaEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acrLoginServer
          identity: managedIdentityId
        }
      ]
      secrets: [
        {
          name: 'database-url'
          keyVaultUrl: dbUrlSecretUri
          identity: managedIdentityId
        }
        {
          name: 'admin-password'
          keyVaultUrl: adminPasswordSecretUri
          identity: managedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'snaktocat'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'ADMIN_PASSWORD'
              secretRef: 'admin-password'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output environmentId string = acaEnvironment.id
output environmentDefaultDomain string = acaEnvironment.properties.defaultDomain
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppName string = containerApp.name
