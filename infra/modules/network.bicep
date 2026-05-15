@description('Primary location')
param location string

@description('Resource tags')
param tags object

@description('Unique suffix for resource names')
param resourceToken string

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-snake-${resourceToken}'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
  }

  resource acaSubnet 'subnets' = {
    name: 'aca-subnet'
    properties: {
      addressPrefix: '10.0.0.0/23'
      networkSecurityGroup: { id: acaNsg.id }
      delegations: [
        {
          name: 'aca-delegation'
          properties: {
            serviceName: 'Microsoft.App/environments'
          }
        }
      ]
    }
  }

  resource pgSubnet 'subnets' = {
    name: 'pg-subnet'
    dependsOn: [acaSubnet]
    properties: {
      addressPrefix: '10.0.2.0/24'
      networkSecurityGroup: { id: pgNsg.id }
      delegations: [
        {
          name: 'pg-delegation'
          properties: {
            serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
          }
        }
      ]
    }
  }

  resource peSubnet 'subnets' = {
    name: 'pe-subnet'
    dependsOn: [pgSubnet]
    properties: {
      addressPrefix: '10.0.3.0/24'
      networkSecurityGroup: { id: peNsg.id }
    }
  }
}

// NSGs — defined explicitly so Azure Policy doesn't add them and disrupt networking
resource acaNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-aca-${resourceToken}'
  location: location
  tags: tags
}

resource pgNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-pg-${resourceToken}'
  location: location
  tags: tags
}

resource peNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-pe-${resourceToken}'
  location: location
  tags: tags
}

// Private DNS Zones
resource pgDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'

  resource pgDnsLink 'virtualNetworkLinks' = {
    name: 'pg-dns-link'
    location: 'global'
    properties: {
      virtualNetwork: { id: vnet.id }
      registrationEnabled: false
    }
  }
}

resource acrDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.azurecr.io'
  location: 'global'

  resource acrDnsLink 'virtualNetworkLinks' = {
    name: 'acr-dns-link'
    location: 'global'
    properties: {
      virtualNetwork: { id: vnet.id }
      registrationEnabled: false
    }
  }
}

resource kvDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'

  resource kvDnsLink 'virtualNetworkLinks' = {
    name: 'kv-dns-link'
    location: 'global'
    properties: {
      virtualNetwork: { id: vnet.id }
      registrationEnabled: false
    }
  }
}

output vnetId string = vnet.id
output acaSubnetId string = vnet::acaSubnet.id
output pgSubnetId string = vnet::pgSubnet.id
output peSubnetId string = vnet::peSubnet.id
output pgDnsZoneId string = pgDnsZone.id
output acrDnsZoneId string = acrDnsZone.id
output kvDnsZoneId string = kvDnsZone.id
