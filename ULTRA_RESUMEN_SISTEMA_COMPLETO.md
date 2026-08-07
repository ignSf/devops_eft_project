# ⚡ Ultra Resumen: Sistema DevOps Completo Montado en AWS

---

## 🏗️ Arquitectura en 1 Diagrama

```
                            ┌─────────────────────────────┐
                            │      USUARIO (Internet)      │
                            └──────────────┬──────────────┘
                                           │ HTTP :80
                                           ▼
                    ┌──────────────────────────────────────────┐
                    │  AWS Network Load Balancer (Subred Pub)  │
                    │  sg-0289686b9df8f66b4 → Puerto 80 abierto│
                    └──────────────────────┬───────────────────┘
                                           │
               ┌───────────────────────────┼───────────────────────────┐
               ▼                                                       ▼
  ┌─────────────────────────┐                             ┌─────────────────────────┐
  │  Pod Frontend (Réplica 1)│                             │  Pod Frontend (Réplica 2)│
  │  nginx:1.25-alpine       │                             │  nginx:1.25-alpine       │
  │  Puerto 80               │                             │  Puerto 80               │
  │  Label: app=devops-frontend                            │  Label: app=devops-frontend
  └────────────┬─────────────┘                             └────────────┬─────────────┘
               │ proxy_pass http://backend:5000/api/                    │
               └───────────────────────────┬───────────────────────────┘
                                           │ NetworkPolicy: solo app=devops-frontend
                                           ▼
               ┌───────────────────────────┼───────────────────────────┐
               ▼                                                       ▼
  ┌─────────────────────────┐                             ┌─────────────────────────┐
  │  Pod Backend (Réplica 1) │                             │  Pod Backend (Réplica 2) │
  │  node:20-alpine          │                             │  node:20-alpine          │
  │  Puerto 5000             │                             │  Puerto 5000             │
  │  USER node (no root)     │                             │  USER node (no root)     │
  │  Label: app=devops-backend                             │  Label: app=devops-backend
  └────────────┬─────────────┘                             └────────────┬─────────────┘
               │ pg connection → database:5432                          │
               └───────────────────────────┬───────────────────────────┘
                                           │ NetworkPolicy: solo app=devops-backend
                                           ▼
                              ┌─────────────────────────┐
                              │  Pod PostgreSQL (1 répl) │
                              │  postgres:16-alpine      │
                              │  Puerto 5432             │
                              │  Label: app=postgres     │
                              │  Volume: emptyDir        │
                              │  DB: devops_db           │
                              │  User: devops_user       │
                              └─────────────────────────┘
```

---

## 📊 Inventario Completo de Recursos

### Red AWS (VPC)
| Recurso | Nombre | ID / Valor |
| :--- | :--- | :--- |
| VPC | `devops-eks-vpc` | `vpc-07772e6acab483468` / CIDR `10.0.0.0/16` |
| Subred Pública 1A | `devops-public-subnet-1a` | `subnet-0662c9236328b212f` / `10.0.1.0/24` / `us-east-1a` |
| Subred Pública 1B | `devops-public-subnet-1b` | `subnet-0105335a59a4c7aa7` / `10.0.2.0/24` / `us-east-1b` |
| Subred Privada 1A | `devops-private-subnet-1a` | `subnet-0ff56fe4910477203` / `10.0.10.0/24` / `us-east-1a` |
| Subred Privada 1B | `devops-private-subnet-1b` | `subnet-06644b3d366c360c2` / `10.0.20.0/24` / `us-east-1b` |
| Internet Gateway | `devops-igw` | Adjunto a la VPC |
| NAT Gateway | `devops-nat-gw` | En subred pública 1A con Elastic IP |
| Route Table Pública | `devops-public-rt` | `0.0.0.0/0` → IGW |
| Route Table Privada | `devops-private-rt` | `0.0.0.0/0` → NAT Gateway |

### Security Groups
| SG | ID | Puertos Abiertos |
| :--- | :--- | :--- |
| `devops-eks-cluster-sg` | `sg-0cdefee98e5f938b6` | 443 desde `10.0.0.0/16` (API Server K8s) |
| `devops-eks-workers-sg` | `sg-0289686b9df8f66b4` | 80, 443 desde `0.0.0.0/0` · 5000, 5432 desde `10.0.0.0/16` |

### Amazon EKS
| Recurso | Valor |
| :--- | :--- |
| Clúster | `devops-eks-cluster` — Estado: ACTIVE |
| Versión K8s | 1.31 / 1.36 |
| Node Group | `devops-worker-nodes` — 2x `t3.medium` (min=1, max=3) |
| IAM Role | `arn:aws:iam::571617431105:role/LabRole` |
| Cuenta AWS | `571617431105` — Región `us-east-1` |

### Amazon ECR (Registro de Imágenes)
| Repositorio | URI |
| :--- | :--- |
| Backend | `571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend` |
| Frontend | `571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend` |

---

## ☸️ Objetos Kubernetes Desplegados

| Objeto | Nombre | Detalles Clave |
| :--- | :--- | :--- |
| **Deployment** | `postgres-deployment` | 1 réplica, `postgres:16-alpine`, estrategia `Recreate`, probe: `pg_isready` |
| **Deployment** | `backend-deployment` | 2 réplicas, imagen ECR, estrategia `RollingUpdate` (maxSurge=1, maxUnavailable=0), probe: `/api/health` |
| **Deployment** | `frontend-deployment` | 2 réplicas, imagen ECR, estrategia `RollingUpdate`, probe: `/` puerto 80 |
| **Service** | `database` | `ClusterIP` → puerto 5432 → selector `app: postgres` |
| **Service** | `backend` | `ClusterIP` → puerto 5000 → selector `app: devops-backend` |
| **Service** | `frontend` | `LoadBalancer` (NLB) → puerto 80 → selector `app: devops-frontend` |
| **Secret** | `db-credentials` | `username=devops_user`, `password=devops_pass123` |
| **HPA** | `backend-hpa` | 2→5 réplicas al 70% CPU, 80% memoria |
| **HPA** | `frontend-hpa` | 2→4 réplicas al 75% CPU |
| **NetworkPolicy** | `database-network-policy` | Ingress :5432 solo desde `app: devops-backend` |
| **NetworkPolicy** | `backend-network-policy` | Ingress :5000 solo desde `app: devops-frontend` |

---

## 🐳 Docker Local (Docker Compose)

| Servicio | Contenedor | Imagen | Puerto | Healthcheck |
| :--- | :--- | :--- | :--- | :--- |
| `database` | `devops_postgres_db` | `postgres:16-alpine` | 5432 | `pg_isready -U devops_user -d devops_db` |
| `backend` | `devops_backend_api` | Build `./backend/Dockerfile` | 5000 | `wget http://localhost:5000/api/health` |
| `frontend` | `devops_frontend_web` | Build `./frontend/Dockerfile` | 80 | — |

- **Red:** `devops_internal_network` (bridge)
- **Volumen:** `devops_postgres_data_volume`
- **Orden:** DB (healthy) → Backend → Frontend

---

## 🔄 Pipeline CI/CD (GitHub Actions)

**Archivo:** `.github/workflows/ci-cd.yml`  
**Trigger:** Push a `main`, `master` o `develop`

| Etapa | Nombre | Qué Hace |
| :--- | :--- | :--- |
| 1 | 🧪 Pruebas Unitarias | `npm ci` + `npm test` (Jest, 4 tests) en Node.js 20 |
| 2 | 🐳 Build & Push | Construye imágenes Docker → Push a ECR con tags `latest` + `v<run_number>` |
| 3 | 🚀 Deploy EKS | `kubectl rollout restart deployment/frontend-deployment` y `backend-deployment` |

**Secretos en GitHub:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`

---

## 🌐 Endpoints de la Aplicación

| Endpoint | Método | Respuesta |
| :--- | :--- | :--- |
| `/` | GET | Dashboard HTML con estado del sistema |
| `/api/health` | GET | `{"status":"UP", "backendVersion":"v4.0-EKS-Live", "totalRequestsServed":N}` |
| `/api/metrics` | GET | `{"uptimeSeconds":N, "memoryUsageMB":{"rss":N,"heapTotal":N,"heapUsed":N}}` |
| `/api/tasks` | GET | `{"success":true, "data":[...4 tareas de system_tasks...]}` |
| `/api/tasks` | POST | Crea nueva tarea (body: `{"title":"..."}`) |

---

## 🛡️ Seguridad Implementada (Resumen)

| Capa | Mecanismo | Detalle |
| :--- | :--- | :--- |
| **Red AWS** | Subredes Privadas | DB y API aisladas de Internet |
| **Firewall AWS** | Security Groups | Puertos 5000/5432 solo accesibles desde `10.0.0.0/16` |
| **Contenedor** | Multi-Stage Build | Imagen final sin devDependencies ni herramientas de compilación |
| **Contenedor** | `USER node` | Backend corre como usuario no privilegiado (sin root) |
| **Kubernetes** | NetworkPolicies | DB solo acepta tráfico del Backend; Backend solo del Frontend |
| **Kubernetes** | Secrets | Credenciales de DB inyectadas como variables cifradas, no hardcodeadas |
| **CI/CD** | GitHub Secrets | Claves AWS cifradas, nunca expuestas en logs ni código |
| **ECR** | scanOnPush | Escaneo automático de vulnerabilidades CVE en cada imagen subida |

---

## 📁 Estructura del Proyecto (Archivos Clave)

```
devops_eft_project/
├── .github/workflows/ci-cd.yml          ← Pipeline CI/CD (3 etapas)
├── backend/
│   ├── Dockerfile                       ← Multi-stage: build+test → production (USER node)
│   ├── src/app.js                       ← Endpoints: /api/health, /api/metrics, /api/tasks
│   ├── src/db.js                        ← Pool PostgreSQL + auto-init tablas + seed data
│   └── tests/app.test.js                ← 4 tests unitarios Jest
├── frontend/
│   ├── Dockerfile                       ← nginx:1.25-alpine + HTML estático
│   ├── nginx.conf                       ← Proxy inverso: /api/ → backend:5000
│   └── public/index.html                ← Dashboard web con métricas y estado
├── database/
│   └── init.sql                         ← CREATE TABLE + INSERT datos iniciales
├── k8s/
│   ├── namespace.yaml                   ← Namespace: devops-production
│   ├── database-deployment.yaml         ← Deployment + Service ClusterIP (postgres)
│   ├── backend-deployment.yaml          ← Deployment + Service ClusterIP (backend)
│   ├── frontend-deployment.yaml         ← Deployment + Service LoadBalancer (frontend)
│   ├── network-policies.yaml            ← 2 NetworkPolicies (micro-segmentación)
│   └── hpa.yaml                         ← 2 HPAs (backend 70% CPU, frontend 75% CPU)
└── docker-compose.yml                   ← Orquestación local: 3 servicios + red + volumen
```
