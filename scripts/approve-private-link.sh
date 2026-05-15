#!/bin/bash
set -e

echo "Checking for pending Front Door Private Link connections..."

ACA_ENV_ID=$(az containerapp env list -g "$AZURE_RESOURCE_GROUP" --query "[0].id" -o tsv)

if [ -z "$ACA_ENV_ID" ]; then
  echo "No Container Apps Environment found, skipping"
  exit 0
fi

PE_CONN=$(az network private-endpoint-connection list --id "$ACA_ENV_ID" --query "[?properties.privateLinkServiceConnectionState.status=='Pending'].name" -o tsv)

if [ -n "$PE_CONN" ]; then
  echo "Approving Private Link connection: $PE_CONN"
  az network private-endpoint-connection approve \
    --id "$ACA_ENV_ID/privateEndpointConnections/$PE_CONN" \
    --description "Auto-approved by azd hook"
  echo "Private Link connection approved"
else
  echo "No pending Private Link connections"
fi
