# GKE DevTest Environment Reference

**Environment:** DevTest
**GCP Project:** tesseracthub-480811
**Domain:** *.tesserix.app

---

## URL Patterns

### Frontend Applications

| Application | Static URL | Per-Tenant Pattern |
|------------|------------|-------------------|
| **Onboarding** | `https://dev-onboarding.tesserix.app` | N/A (entry point) |
| **Admin Portal** | `https://dev-admin.tesserix.app` | `https://{slug}-admin.tesserix.app` |
| **Storefront** | `https://dev-store.tesserix.app` | `https://{slug}-store.tesserix.app` |

### API Gateway

| Type | URL Pattern |
|------|-------------|
| **DevTest API** | `https://dev-api.tesserix.app` |
| **Per-Tenant API** | `https://{slug}-api.tesserix.app` |

### Identity (Keycloak)

| IDP | URL | Realm |
|-----|-----|-------|
| **Customer IDP** | `https://devtest-customer-idp.tesserix.app` | `tesserix-customer` |
| **Internal IDP** | `https://devtest-internal-idp.tesserix.app` | `tesserix-internal` |

**JWKS URLs:**
- Customer: `https://devtest-customer-idp.tesserix.app/realms/tesserix-customer/protocol/openid-connect/certs`
- Internal: `https://devtest-internal-idp.tesserix.app/realms/tesserix-internal/protocol/openid-connect/certs`

---

## Test Tenants

### Existing (DO NOT DELETE)

| Tenant | Slug | Admin URL | Storefront URL | Type |
|--------|------|-----------|----------------|------|
| Demo Store | `demo-store` | `https://demo-store-admin.tesserix.app` | `https://demo-store-store.tesserix.app` | ONLINE_STORE |

### Test Tenants (To Be Created)

| Tenant | Slug | Region | Currency | Timezone | Type |
|--------|------|--------|----------|----------|------|
| AI Test India | `ai-test-ind` | India | INR | Asia/Kolkata | ONLINE_STORE |
| AI Test Australia | `ai-test-aus` | Australia | AUD | Australia/Sydney | MARKETPLACE |

---

## Backend Services (Internal Cluster)

| Service | Port | API Path | Namespace |
|---------|------|----------|-----------|
| products-service | 8080 | /api/v1 | marketplace |
| orders-service | 8080 | /api/v1 | marketplace |
| customers-service | 8080 | /api/v1 | marketplace |
| vendor-service | 8080 | /api/v1 | marketplace |
| staff-service | 8080 | /api/v1 | marketplace |
| categories-service | 8080 | /api/v1 | marketplace |
| coupons-service | 8080 | /api/v1 | marketplace |
| inventory-service | 8088 | /api/v1 | marketplace |
| payment-service | 8080 | /api/v1 | marketplace |
| tax-service | 8091 | /api/v1 | marketplace |
| analytics-service | 8092 | /api/v1 | marketplace |
| marketing-service | 8080 | /api/v1 | marketplace |
| shipping-service | 8080 | /api/v1 | marketplace |
| gift-cards-service | 8080 | /api/v1 | marketplace |
| settings-service | 8085 | - | marketplace |
| tenant-service | 8080 | /api/v1 | marketplace |
| tenant-router-service | 8089 | - | marketplace |
| location-service | 8080 | /api/v1 | marketplace |
| document-service | 8080 | - | marketplace |
| notification-service | 8090 | - | marketplace |
| verification-service | 8080 | - | marketplace |

---

## Monitoring & Observability

| Tool | URL |
|------|-----|
| Grafana | `https://dev-grafana.tesserix.app` |
| Kibana | `https://dev-kibana.tesserix.app` |
| Prometheus | `https://dev-prometheus.tesserix.app` |
| AlertManager | `https://dev-alertmanager.tesserix.app` |
| Elasticsearch | `https://dev-elasticsearch.tesserix.app` |

---

## Infrastructure Components

| Component | Technology | Notes |
|-----------|------------|-------|
| **Ingress** | Istio Gateway | Wildcard cert for *.tesserix.app |
| **DNS** | External DNS | Auto-manages DNS records |
| **Certificates** | Cert-Manager | Let's Encrypt |
| **Database** | PostgreSQL | Shared in postgresql-global namespace |
| **Cache** | Redis | Per-namespace Redis instances |
| **Message Queue** | NATS | JetStream enabled |
| **Search** | Typesense | For product search |
| **Email** | Postal | Self-hosted, smtp.tesserix.app |

---

## Test Configuration

### Environment Variables for E2E Tests

```bash
# Required for tests
export API_BASE_URL="https://demo-store-api.tesserix.app"
export ADMIN_URL="https://demo-store-admin.tesserix.app"
export STOREFRONT_URL="https://demo-store-store.tesserix.app"
export ONBOARDING_URL="https://dev-onboarding.tesserix.app"
export KEYCLOAK_URL="https://devtest-customer-idp.tesserix.app"

# Test tenant (existing)
export TEST_TENANT_ID="demo-store"
export TEST_TENANT_SLUG="demo-store"

# For email verification tests
export TEST_EMAIL="mahesh.sangawar@gmail.com"

# Regional test configs
export TEST_REGION_PRIMARY="IN"  # India
export TEST_REGION_SECONDARY="AU"  # Australia
```

### Headers Required for API Calls

```javascript
{
  "X-Tenant-ID": "{tenant_uuid}",
  "X-Vendor-ID": "{vendor_uuid}",  // Usually same as tenant for ONLINE_STORE
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt_token}"
}
```

---

## Super Admin Access

The following emails have super admin access to Keycloak:
- unidevidp@gmail.com
- mahesh.sangawar@gmail.com
- samyak.rout@gmail.com

---

## Quick Reference Commands

```bash
# Access GKE cluster (requires gcloud auth)
gcloud container clusters get-credentials <cluster-name> --zone <zone> --project tesseracthub-480811

# Port-forward to a service
kubectl port-forward svc/products-service 8080:8080 -n marketplace

# View logs for a service
kubectl logs -f deployment/orders-service -n marketplace

# Check pod status
kubectl get pods -n marketplace

# View ArgoCD apps
kubectl get applications -n argocd
```

---

*Last Updated: January 2025*
*Source: tesserix-k8s/argocd/devtest/*
