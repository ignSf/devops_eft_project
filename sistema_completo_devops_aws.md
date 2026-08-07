# 📘 Manual Técnico Desglosado y Paso a Paso Completo: Sistema DevOps Cloud AWS EKS

> [!IMPORTANT]
> Este documento es la **guía de desglose absoluto y paso a paso definitivo** de todo el sistema montado en la infraestructura AWS y Docker. Cada recurso, regla, subred, puerto, variable y comando está listado de forma directa, ultra clara y sin omisiones.

---

## 📑 ÍNDICE DE NAVEGACIÓN RÁPIDA

1. [DESGLOSE 1: Red y Conectividad (VPC, Subredes, Gateways, Route Tables)](#1-desglose-1-red-y-conectividad)
2. [DESGLOSE 2: Security Groups y Reglas de Entrada/Salida (Firewalls)](#2-desglose-2-security-groups-y-reglas-de-entrada-y-salida)
3. [DESGLOSE 3: Amazon EKS (Control Plane y Node Groups)](#3-desglose-3-amazon-eks-control-plane-y-node-groups)
4. [DESGLOSE 4: Registro ECR e Imágenes Docker (Contenerización)](#4-desglose-4-registro-ecr-e-imágenes-docker)
5. [DESGLOSE 5: Kubernetes Manifests (Pods, Services, HPAs, NetworkPolicies)](#5-desglose-5-kubernetes-manifests-y-objetos-desplegados)
6. [DESGLOSE 6: Pipeline CI/CD en GitHub Actions (.github/workflows/ci-cd.yml)](#6-desglose-6-pipeline-cicd-en-github-actions)
7. [DESGLOSE 7: Métricas, Observabilidad y Endpoints de Telemetría](#7-desglose-7-métricas-observabilidad-y-endpoints)
8. [DESGLOSE 8: Entorno Local con Docker Compose](#8-desglose-8-entorno-local-con-docker-compose)
9. [PASO A PASO CRONOLÓGICO DEFINITIVO (De 0 a 100)](#9-paso-a-paso-cronológico-definitivo)

---

## 1. DESGLOSE 1: Red y Conectividad

### 1.1 Virtual Private Cloud (VPC)
* **Nombre tag:** `devops-eks-vpc`
* **ID real AWS:** `vpc-07772e6acab483468`
* **Bloque IPv4 CIDR:** `10.0.0.0/16` (Total de 65,536 IPs privadas reservadas)
* **Atributos activados:**
  * `enableDnsSupport`: `true` (Permite resolución de nombres en la red interna)
  * `enableDnsHostnames`: `true` (Asigna nombres DNS a instancias y balanceadores)

---

### 1.2 Subredes (4 Subredes en 2 Zonas de Disponibilidad Multi-AZ)

```
                            ┌─────────────────────────────────────────┐
                            │    VPC: devops-eks-vpc (10.0.0.0/16)    │
                            └────────────────────┬────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      Zona de Disponibilidad: us-east-1a                          Zona de Disponibilidad: us-east-1b
┌──────────────────────────────────────────────┐            ┌──────────────────────────────────────────────┐
│ PÚBLICA 1A: 10.0.1.0/24 (subnet-0662c923...) │            │ PÚBLICA 1B: 10.0.2.0/24 (subnet-0105335a...) │
│  - Asigna IP Pública Automática: SÍ          │            │  - Asigna IP Pública Automática: SÍ          │
│  - Alberga: NLB + NAT Gateway                │            │  - Alberga: NLB (Redundante)                 │
├──────────────────────────────────────────────┤            ├──────────────────────────────────────────────┤
│ PRIVADA 1A: 10.0.10.0/24 (subnet-0ff56fe4...)│            │ PRIVADA 1B: 10.0.20.0/24 (subnet-06644b3d...)│
│  - Asigna IP Pública Automática: NO          │            │  - Asigna IP Pública Automática: NO          │
│  - Alberga: Nodo Worker 1 (EKS) + Pods       │            │  - Alberga: Nodo Worker 2 (EKS) + DB Pod     │
└──────────────────────────────────────────────┘            └──────────────────────────────────────────────┘
```

#### Detalle Técnico de cada Subred:

1. **`devops-public-subnet-1a`**
   * **ID:** `subnet-0662c9236328b212f`
   * **CIDR:** `10.0.1.0/24` (256 IPs) | **AZ:** `us-east-1a`
   * **Tipo:** Pública (MapPublicIpOnLaunch = `true`)
   * **Tags Kubernetes:** `kubernetes.io/role/elb = 1` (Indica a EKS que aquí puede crear balanceadores públicos)

2. **`devops-public-subnet-1b`**
   * **ID:** `subnet-0105335a59a4c7aa7`
   * **CIDR:** `10.0.2.0/24` (256 IPs) | **AZ:** `us-east-1b`
   * **Tipo:** Pública (MapPublicIpOnLaunch = `true`)
   * **Tags Kubernetes:** `kubernetes.io/role/elb = 1`

3. **`devops-private-subnet-1a`**
   * **ID:** `subnet-0ff56fe4910477203`
   * **CIDR:** `10.0.10.0/24` (256 IPs) | **AZ:** `us-east-1a`
   * **Tipo:** Privada (MapPublicIpOnLaunch = `false`)
   * **Tags Kubernetes:** `kubernetes.io/role/internal-elb = 1` (Para balanceadores internos)

4. **`devops-private-subnet-1b`**
   * **ID:** `subnet-06644b3d366c360c2`
   * **CIDR:** `10.0.20.0/24` (256 IPs) | **AZ:** `us-east-1b`
   * **Tipo:** Privada (MapPublicIpOnLaunch = `false`)
   * **Tags Kubernetes:** `kubernetes.io/role/internal-elb = 1`

---

### 1.3 Gateways y Ruteo

* **Internet Gateway (IGW):**
  * **Nombre:** `devops-igw`
  * **Función:** Conecta la VPC a la red pública de Internet.
* **NAT Gateway:**
  * **Nombre:** `devops-nat-gw`
  * **Ubicación:** Subred pública `devops-public-subnet-1a` (`10.0.1.0/24`)
  * **Elastic IP (EIP):** IP pública fija asignada por AWS.
  * **Función:** Permite que los servidores en subredes privadas salgan a Internet (descargar paquetes/imágenes) pero **impide** que desde Internet inicien conexiones hacia las subredes privadas.
* **Tablas de Ruteo (Route Tables):**
  1. **`devops-public-rt` (Pública):**
     * Regla: `0.0.0.0/0` $\rightarrow$ `devops-igw`
     * Asociada a: `devops-public-subnet-1a` y `devops-public-subnet-1b`
  2. **`devops-private-rt` (Privada):**
     * Regla: `0.0.0.0/0` $\rightarrow$ `devops-nat-gw`
     * Asociada a: `devops-private-subnet-1a` y `devops-private-subnet-1b`

---

## 2. DESGLOSE 2: Security Groups y Reglas de Entrada/Salida

Existen **2 Security Groups (Firewalls virtuales)** creados en el proyecto:

---

### 2.1 Security Group del Control Plane de EKS (`devops-eks-cluster-sg`)
* **ID real:** `sg-0cdefee98e5f938b6`
* **Descripción:** Protege los servidores maestros (API Server) administrados por AWS.
* **Reglas de Entrada (Inbound):**

| Protocolo | Puerto | Origen (Source) | Descripción / Justificación |
| :--- | :--- | :--- | :--- |
| **TCP** | `443` | `10.0.0.0/16` (VPC CIDR) | Permite que los agentes `kubelet` de los nodos worker se comuniquen de forma cifrada HTTPS con el API Server. |

---

### 2.2 Security Group de los Nodos Worker (`devops-eks-workers-sg`)
* **ID real:** `sg-0289686b9df8f66b4`
* **Descripción:** Protege las instancias EC2 donde corren los contenedores.
* **Reglas de Entrada (Inbound):**

| Protocolo | Puerto | Origen (Source) | Descripción / Justificación |
| :--- | :--- | :--- | :--- |
| **TCP** | `80` | `0.0.0.0/0` (Cualquier IP) | Tráfico HTTP público hacia el LoadBalancer web del Frontend Nginx. |
| **TCP** | `443` | `0.0.0.0/0` (Cualquier IP) | Tráfico HTTPS público hacia el LoadBalancer web. |
| **TCP** | `5000` | `10.0.0.0/16` (Solo VPC) | Puerto de la API REST Node.js. Restringido para que NUNCA sea accesible directo desde Internet. |
| **TCP** | `5432` | `10.0.0.0/16` (Solo VPC) | Puerto del motor PostgreSQL 16. Restringido para que NUNCA sea accesible directo desde Internet. |
| **ALL** | Todos | `10.0.0.0/16` (Solo VPC) | Tráfico inter-nodo completo (Kubelet, CNI Flannel/Weave, DNS interno en puerto 53). |

* **Reglas de Salida (Outbound):**
  * `0.0.0.0/0` (Todo el tráfico permitido hacia afuera a través del NAT Gateway).

---

## 3. DESGLOSE 3: Amazon EKS (Control Plane y Node Groups)

---

### 3.1 Configuración del Control Plane (Maestro)
* **Nombre del Clúster:** `devops-eks-cluster`
* **Versión de Kubernetes:** `1.31` (Compatible con v1.36)
* **Estado:** `ACTIVE`
* **IAM Role del Clúster:** `arn:aws:iam::571617431105:role/LabRole`
* **Acceso a Endpoints del API Server:**
  * **Public Access:** `true` (Permite controlar el clúster con `kubectl` desde tu terminal)
  * **Private Access:** `true` (Permite comunicación interna de los nodos por IP privada)
* **Subredes Asociadas:** Las 4 subredes (`devops-public-subnet-1a`, `1b` y `devops-private-subnet-1a`, `1b`)
* **Security Group del Clúster:** `sg-0cdefee98e5f938b6`
* **Tipos de Logs Activados en CloudWatch:** `api`, `audit`, `authenticator`, `controllerManager`, `scheduler`.

---

### 3.2 Configuración del Node Group (Nodos Worker EC2)
* **Nombre del Node Group:** `devops-worker-nodes`
* **IAM Role de los Nodos:** `arn:aws:iam::571617431105:role/LabRole`
* **Tipo de Instancias EC2:** `t3.medium` (2 vCPUs virtuales, 4 GiB de memoria RAM por nodo)
* **Sistema Operativo (AMI):** `Amazon Linux 2023` (`AL2023_x86_64_STANDARD`)
* **Tamaño de Disco Root (EBS):** `20 GiB` por nodo
* **Tipo de Capacidad:** `ON_DEMAND` (Instancias garantizadas sin interrupción)
* **Configuración de Auto-Escalado (Scaling Config):**
  * `minSize`: `1` (Mínimo 1 servidor físico)
  * `maxSize`: `3` (Máximo 3 servidores físicos)
  * `desiredSize`: `2` (Capacidad deseada actual: 2 servidores físicos activos)
* **Subredes de Lanzamiento:** Subredes públicas `devops-public-subnet-1a` y `devops-public-subnet-1b` (para asignación directa de IPs al LoadBalancer).

---

## 4. DESGLOSE 4: Registro ECR e Imágenes Docker

### 4.1 Repositorios Privados en Amazon ECR (Cuenta `571617431105`)
1. **`devops-backend`**
   * URI: `571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend`
   * Escaneo al Push: `scanOnPush = true` (Audita vulnerabilidades CVE de librerías npm al publicar)
   * Tags aplicados: `latest` y `v<run_number>` (ej: `v1`, `v2`, etc.)
2. **`devops-frontend`**
   * URI: `571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend`
   * Escaneo al Push: `scanOnPush = true`
   * Tags aplicados: `latest` y `v<run_number>`

---

### 4.2 Arquitectura de los Dockerfiles

#### A) Backend Dockerfile (`backend/Dockerfile`):
```dockerfile
# ETAPA 1: Build y Test Unitario
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                        # Instala TODAS las dependencias (dev + prod)
COPY . .
RUN npm test -- --passWithNoTests # Ejecuta Jest. Si falla 1 test, SE ABORTA EL BUILD

# ETAPA 2: Producción Reducida + Hardening
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force # Solo dep de prod
COPY --from=build /app/src ./src

USER node                         # Hardening: Ejecuta como usuario no-root

EXPOSE 5000
CMD ["node", "src/server.js"]
```

#### B) Frontend Dockerfile (`frontend/Dockerfile`):
```dockerfile
FROM nginx:1.25-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf # Inyecta Reverse Proxy
COPY public/ /usr/share/nginx/html/             # Copia activos estáticos HTML/JS
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. DESGLOSE 5: Kubernetes Manifests y Objetos Desplegados

---

### 5.1 Objetos Creados en el Clúster EKS

| Objeto K8s | Nombre | Archivo Fuente | Configuración Detallada |
| :--- | :--- | :--- | :--- |
| **Namespace** | `devops-production` | `k8s/namespace.yaml` | Espacio de nombres aislado para el entorno de producción |
| **Secret** | `db-credentials` | CLI / GitHub Actions | Contiene `username=devops_user` y `password=devops_pass123` cifrados en Base64 |
| **Deployment** | `postgres-deployment` | `k8s/database-deployment.yaml` | **1 réplica** de `postgres:16-alpine`. `Recreate` strategy. Probe: `pg_isready` en 5432. |
| **Service** | `database` | `k8s/database-deployment.yaml` | `ClusterIP` interno en puerto **5432**. Selector: `app: postgres`. |
| **Deployment** | `backend-deployment` | `k8s/backend-deployment.yaml` | **2 réplicas** de `devops-backend:latest`. `RollingUpdate` (maxSurge=1, maxUnavail=0). Probes en `/api/health` puerto 5000. Resources: CPU req 100m / limit 250m, RAM req 128Mi / limit 256Mi. |
| **Service** | `backend` | `k8s/backend-deployment.yaml` | `ClusterIP` interno en puerto **5000**. Selector: `app: devops-backend`. |
| **Deployment** | `frontend-deployment` | `k8s/frontend-deployment.yaml` | **2 réplicas** de `devops-frontend:latest`. `RollingUpdate`. Probes en `/` puerto 80. Resources: CPU req 50m / limit 100m, RAM req 64Mi / limit 128Mi. |
| **Service** | `frontend` | `k8s/frontend-deployment.yaml` | **`LoadBalancer` (NLB público)** en puerto **80**. Selector: `app: devops-frontend`. Anotaciones: `aws-load-balancer-type: nlb`, `internet-facing`. |
| **HPA** | `backend-hpa` | `k8s/hpa.yaml` | Escala `backend-deployment` de **2 a 5 réplicas** si el consumo promedio de CPU supera el **70%** o memoria el **80%**. |
| **HPA** | `frontend-hpa` | `k8s/hpa.yaml` | Escala `frontend-deployment` de **2 a 4 réplicas** si el CPU supera el **75%**. |
| **NetworkPolicy**| `database-network-policy` | `k8s/network-policies.yaml` | **Bloqueo estricto DB:** El puerto 5432 del pod `app: postgres` SOLO acepta tráfico del pod con etiqueta `app: devops-backend`. |
| **NetworkPolicy**| `backend-network-policy` | `k8s/network-policies.yaml` | **Bloqueo estricto API:** El puerto 5000 del pod `app: devops-backend` SOLO acepta tráfico del pod con etiqueta `app: devops-frontend`. |

---

## 6. DESGLOSE 6: Pipeline CI/CD en GitHub Actions

* **Archivo:** `.github/workflows/ci-cd.yml`
* **Disparadores (Triggers):** Cada `push` a las ramas `main`, `master` o `develop`, o cada `pull_request`.

```
                    ┌─────────────────────────────────────────┐
                    │      EVENTO: git push origin main       │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ JOB 1: 🧪 Pruebas Unitarias y Calidad (Runs on: ubuntu-latest)                 │
 │  1. Checkout código                                                           │
 │  2. Configurar Node.js v20                                                    │
 │  3. npm ci en folder ./backend                                                │
 │  4. npm test -- --passWithNoTests (Prueba Jest)                               │
 └───────────────────────────────────────┬───────────────────────────────────────┘
                                         │ (Si Pasa OK)
                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ JOB 2: 🐳 Construcción y Publicación ECR (Needs: test)                         │
 │  1. configure-aws-credentials (con GitHub Secrets)                            │
 │  2. Login en Amazon ECR                                                       │
 │  3. Build & Push Backend -> ECR (Tags: latest, v<build_number>)               │
 │  4. Build & Push Frontend -> ECR (Tags: latest, v<build_number>)              │
 └───────────────────────────────────────┬───────────────────────────────────────┘
                                         │ (Si Pasa OK)
                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ JOB 3: 🚀 Despliegue Automatizado EKS (Needs: build-and-push)                 │
 │  1. configure-aws-credentials                                                 │
 │  2. aws eks update-kubeconfig --name devops-eks-cluster                       │
 │  3. kubectl rollout restart deployment/frontend-deployment                    │
 │  4. kubectl rollout restart deployment/backend-deployment                     │
 └───────────────────────────────────────────────────────────────────────────────┘
```

* **Secretos Requeridos en GitHub Settings:**
  * `AWS_ACCESS_KEY_ID`: Access Key activa del usuario IAM / LabRole.
  * `AWS_SECRET_ACCESS_KEY`: Secret Key activa.
  * `AWS_SESSION_TOKEN`: Session Token del laboratorio (Learner Lab).

---

## 7. DESGLOSE 7: Métricas, Observabilidad y Endpoints

### 7.1 Endpoints de la Aplicación

1. **`GET /` (Frontend HTTP :80):**
   * Retorna la interfaz gráfica HTML/JS renderizada por Nginx con el Dashboard de tareas y el indicador dinámico `v4.0-EKS-Live`.
2. **`GET /api/health` (Backend API HTTP :5000):**
   * Usado por Kubernetes Liveness y Readiness Probes.
   * Ejecuta la consulta SQL `SELECT NOW()` en PostgreSQL.
   * Retorna HTTP 200 OK:
     ```json
     {
       "status": "UP",
       "timestamp": "2026-08-06T20:15:00.000Z",
       "service": "devops-backend-api",
       "environment": "production",
       "backendVersion": "v4.0-EKS-Live",
       "totalRequestsServed": 84
     }
     ```
3. **`GET /api/metrics` (Endpoint de Observabilidad):**
   * Retorna consumo en megabytes de la memoria procesada por Node.js y tiempo de actividad:
     ```json
     {
       "uptimeSeconds": 4520,
       "totalRequestsServed": 84,
       "backendVersion": "v4.0-EKS-Live",
       "memoryUsageMB": { "rss": 45, "heapTotal": 30, "heapUsed": 21 },
       "cpuTimeSeconds": 0.88
     }
     ```
4. **`GET /api/tasks`:**
   * Retorna las 4 tareas de infraestructura desde la tabla `system_tasks` de PostgreSQL en formato JSON.
5. **`POST /api/tasks`:**
   * Recibe JSON `{"title": "...", "description": "..."}` e inserta un nuevo registro en PostgreSQL.

---

### 7.2 Monitoreo de Infraestructura
* **Metrics Server K8s:** Instalado en el clúster (`components.yaml`). Recolecta métricas cada 15 segundos y alimenta los HPA.
* **AWS CloudWatch Log Groups:** Registros auditados centralizados bajo `/aws/eks/devops-eks-cluster/cluster`.

---

## 8. DESGLOSE 8: Entorno Local con Docker Compose

El archivo `docker-compose.yml` permite levantar y probar todo el sistema localmente antes de desplegar en AWS.

### 8.1 Servicios Locales

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    container_name: devops_postgres_db
    environment:
      POSTGRES_USER: devops_user
      POSTGRES_PASSWORD: devops_pass123
      POSTGRES_DB: devops_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - devops-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devops_user -d devops_db"]

  backend:
    build: ./backend
    container_name: devops_backend_api
    environment:
      PORT: 5000
      DB_HOST: database
      DB_PORT: 5432
      DB_USER: devops_user
      DB_PASSWORD: devops_pass123
      DB_NAME: devops_db
    ports:
      - "5000:5000"
    depends_on:
      database:
        condition: service_healthy # Espera a que la DB pase el healthcheck
    networks:
      - devops-net

  frontend:
    build: ./frontend
    container_name: devops_frontend_web
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - devops-net

networks:
  devops-net:
    name: devops_internal_network

volumes:
  postgres_data:
    name: devops_postgres_data_volume
```

---

## 9. PASO A PASO CRONOLÓGICO DEFINITIVO (De 0 a 100)

Si tuvieras que reconstruir todo el proyecto desde una cuenta limpia de AWS, este es el **orden cronológico estricto en 10 etapas**:

```
[ ETAPA 1: VPC 10.0.0.0/16 ] ──► [ ETAPA 2: 4 Subredes Multi-AZ ] ──► [ ETAPA 3: IGW & NAT Gateway ]
                                                                                   │
[ ETAPA 6: Control Plane EKS ] ◄── [ ETAPA 5: Security Groups ] ◄── [ ETAPA 4: Route Tables ]
              │
              ▼
[ ETAPA 7: Node Group EC2 ] ──► [ ETAPA 8: Repositorios ECR ] ──► [ ETAPA 9: K8s Manifests ]
                                                                                   │
                                                                                   ▼
                                                                  [ ETAPA 10: GitHub CI/CD ]
```

### Ejecución de Comandos Etapa por Etapa:

#### **Etapa 1: Red Base (VPC)**
```powershell
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=devops-eks-vpc}]"
# Retorna: vpc-07772e6acab483468
aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-support "{\"Value\":true}"
aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-hostnames "{\"Value\":true}"
```

#### **Etapa 2: Subredes Multi-AZ**
```powershell
# Públicas (us-east-1a y 1b)
aws ec2 create-subnet --vpc-id vpc-07772e6acab483468 --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-public-subnet-1a}]"
aws ec2 create-subnet --vpc-id vpc-07772e6acab483468 --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-public-subnet-1b}]"
aws ec2 modify-subnet-attribute --subnet-id subnet-0662c9236328b212f --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id subnet-0105335a59a4c7aa7 --map-public-ip-on-launch

# Privadas (us-east-1a y 1b)
aws ec2 create-subnet --vpc-id vpc-07772e6acab483468 --cidr-block 10.0.10.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-private-subnet-1a}]"
aws ec2 create-subnet --vpc-id vpc-07772e6acab483468 --cidr-block 10.0.20.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-private-subnet-1b}]"
```

#### **Etapa 3: Gateways (IGW y NAT)**
```powershell
# Internet Gateway
aws ec2 create-internet-gateway --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=devops-igw}]"
aws ec2 attach-internet-gateway --internet-gateway-id igw-0123456789abcdef0 --vpc-id vpc-07772e6acab483468

# Elastic IP + NAT Gateway en subred pública 1A
aws ec2 allocate-address --domain vpc --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=devops-nat-eip}]"
aws ec2 create-nat-gateway --subnet-id subnet-0662c9236328b212f --allocation-id eipalloc-0abc123456789 --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=devops-nat-gw}]"
```

#### **Etapa 4: Tablas de Ruteo**
```powershell
# Ruta pública (0.0.0.0/0 -> IGW)
aws ec2 create-route-table --vpc-id vpc-07772e6acab483468 --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=devops-public-rt}]"
aws ec2 create-route --route-table-id rtb-public123 --destination-cidr-block 0.0.0.0/0 --gateway-id igw-0123456789abcdef0
aws ec2 associate-route-table --route-table-id rtb-public123 --subnet-id subnet-0662c9236328b212f
aws ec2 associate-route-table --route-table-id rtb-public123 --subnet-id subnet-0105335a59a4c7aa7

# Ruta privada (0.0.0.0/0 -> NAT Gateway)
aws ec2 create-route-table --vpc-id vpc-07772e6acab483468 --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=devops-private-rt}]"
aws ec2 create-route --route-table-id rtb-private456 --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-0xyz987654321
aws ec2 associate-route-table --route-table-id rtb-private456 --subnet-id subnet-0ff56fe4910477203
aws ec2 associate-route-table --route-table-id rtb-private456 --subnet-id subnet-06644b3d366c360c2
```

#### **Etapa 5: Security Groups**
```powershell
# Security Group del Clúster EKS
aws ec2 create-security-group --group-name devops-eks-cluster-sg --description "SG Cluster" --vpc-id vpc-07772e6acab483468
aws ec2 authorize-security-group-ingress --group-id sg-0cdefee98e5f938b6 --protocol tcp --port 443 --cidr 10.0.0.0/16

# Security Group de Nodos Worker EC2
aws ec2 create-security-group --group-name devops-eks-workers-sg --description "SG Workers" --vpc-id vpc-07772e6acab483468
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5000 --cidr 10.0.0.0/16
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5432 --cidr 10.0.0.0/16
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol -1 --port -1 --cidr 10.0.0.0/16
```

#### **Etapa 6: Aprovisionar Control Plane EKS (~12 min)**
```powershell
aws eks create-cluster --name devops-eks-cluster --kubernetes-version 1.31 --role-arn arn:aws:iam::571617431105:role/LabRole --resources-vpc-config subnetIds=subnet-0662c9236328b212f,subnet-0105335a59a4c7aa7,subnet-0ff56fe4910477203,subnet-06644b3d366c360c2,securityGroupIds=sg-0cdefee98e5f938b6,endpointPublicAccess=true,endpointPrivateAccess=true
aws eks wait cluster-active --name devops-eks-cluster
aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1
```

#### **Etapa 7: Node Group EC2 (~5 min)**
```powershell
aws eks create-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes --node-role arn:aws:iam::571617431105:role/LabRole --subnets subnet-0662c9236328b212f subnet-0105335a59a4c7aa7 --instance-types t3.medium --scaling-config minSize=1,maxSize=3,desiredSize=2 --ami-type AL2023_x86_64_STANDARD
aws eks wait nodegroup-active --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes
kubectl get nodes -o wide
```

#### **Etapa 8: Repositorios ECR y Push de Imágenes**
```powershell
aws ecr create-repository --repository-name devops-backend --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name devops-frontend --image-scanning-configuration scanOnPush=true

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 571617431105.dkr.ecr.us-east-1.amazonaws.com

docker build -t devops-backend ./backend
docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest

docker build -t devops-frontend ./frontend
docker tag devops-frontend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
```

#### **Etapa 9: Despliegue de Kubernetes Manifests**
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic db-credentials --from-literal=username=devops_user --from-literal=password=devops_pass123
kubectl apply -f k8s/database-deployment.yaml
kubectl rollout status deployment/postgres-deployment --timeout=120s
kubectl apply -f k8s/backend-deployment.yaml
kubectl rollout status deployment/backend-deployment --timeout=120s
kubectl apply -f k8s/frontend-deployment.yaml
kubectl rollout status deployment/frontend-deployment --timeout=120s
kubectl apply -f k8s/network-policies.yaml
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl apply -f k8s/hpa.yaml
```

#### **Etapa 10: Conectar Pipeline CI/CD en GitHub Actions**
```powershell
# Inyectar variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY y AWS_SESSION_TOKEN en GitHub Secrets
git add .
git commit -m "feat: despliegue automatizado listo en EKS"
git push origin main
```
