@description('Primary location')
param location string

@description('Resource tags')
param tags object

@description('Unique suffix for resource names')
param resourceToken string

@description('Container App FQDN for origin')
param containerAppFqdn string

@description('Container Apps Environment ID for Private Link')
param acaEnvironmentId string

resource frontDoor 'Microsoft.Cdn/profiles@2024-09-01' = {
  name: 'fd-snake-${resourceToken}'
  location: 'global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }

  resource fdEndpoint 'afdEndpoints' = {
    name: 'snaktocat'
    location: 'global'
    tags: tags
    properties: {
      enabledState: 'Enabled'
    }

    resource fdRoute 'routes' = {
      name: 'default-route'
      properties: {
        originGroup: {
          id: fdOriginGroup.id
        }
        supportedProtocols: ['Http', 'Https']
        patternsToMatch: ['/*']
        forwardingProtocol: 'HttpsOnly'
        httpsRedirect: 'Enabled'
        linkToDefaultDomain: 'Enabled'
      }
    }
  }

  resource fdOriginGroup 'originGroups' = {
    name: 'aca-origin-group'
    properties: {
      loadBalancingSettings: {
        sampleSize: 4
        successfulSamplesRequired: 3
        additionalLatencyInMilliseconds: 50
      }
      healthProbeSettings: {
        probePath: '/'
        probeRequestType: 'HEAD'
        probeProtocol: 'Https'
        probeIntervalInSeconds: 30
      }
    }

    // Origin with Private Link to internal Container Apps Environment
    resource fdOrigin 'origins' = {
      name: 'aca-origin'
      properties: {
        hostName: containerAppFqdn
        httpPort: 80
        httpsPort: 443
        originHostHeader: containerAppFqdn
        priority: 1
        weight: 1000
        enabledState: 'Enabled'
        sharedPrivateLinkResource: {
          privateLink: {
            id: acaEnvironmentId
          }
          privateLinkLocation: location
          groupId: 'managedEnvironments'
          requestMessage: 'Front Door Private Link to Container Apps'
        }
      }
    }
  }

  resource fdSecurityPolicy 'securityPolicies' = {
    name: 'waf-policy'
    properties: {
      parameters: {
        type: 'WebApplicationFirewall'
        wafPolicy: {
          id: wafPolicy.id
        }
        associations: [
          {
            domains: [
              {
                id: fdEndpoint.id
              }
            ]
            patternsToMatch: ['/*']
          }
        ]
      }
    }
  }
}

// WAF Policy — Premium supports managed rules
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2024-02-01' = {
  name: 'wafsnake${resourceToken}'
  location: 'global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
    }
    customRules: {
      rules: [
        {
          name: 'RateLimitApi'
          priority: 100
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 100
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'Contains'
              matchValue: ['/api/']
            }
          ]
          action: 'Block'
        }
      ]
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleSetAction: 'Block'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.1'
        }
      ]
    }
  }
}

output endpointHostname string = frontDoor::fdEndpoint.properties.hostName
output frontDoorId string = frontDoor.properties.frontDoorId
