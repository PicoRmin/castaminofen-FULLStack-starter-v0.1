# Deployment Guide

Deployment concerns are separated from application logic so environments can evolve independently.

## Deployment layers
- application services under apps/
- runtime configuration under configs/ and infra/
- container and cluster definitions under docker/ and k8s/
- release process guidance under deployment/

## Recommended process
1. Validate changes in a non-production environment.
2. Apply configuration changes through versioned files.
3. Roll out services with monitoring and health checks enabled.
4. Review logs, metrics, and operational impact after deployment.
