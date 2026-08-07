# 🚀 Manual Técnico Desglosado: Opción de Arquitectura AWS ECS (Elastic Container Service) + AWS Fargate

> Este documento es la **guía maestra de arquitectura alternativa** utilizando **AWS ECS (Elastic Container Service) con AWS Fargate (Serverless Containers)** en reemplazo de Kubernetes (EKS). Ideal para explicar a la comisión por qué se elegiría ECS frente a EKS o para implementar una solución 100% nativa de AWS.

---

## 📑 ÍNDICE DE NAVEGACIÓN RÁPIDA

1. [RESUMEN EJECUTIVO: ¿Qué cambia entre EKS y ECS?](#1-resumen-ejecutivo-qué-cambia-entre-eks-y-ecs)
2. [DESGLOSE 1: Red y Conectividad (VPC, Subredes, Gateways, Route Tables)](#2-desglose-1-red-y-conectividad)
3. [DESGLOSE 2: Security Groups y Reglas de Entrada/Salida](#3-desglose-2-security-groups-y-reglas-de-entradaesalida)
4. [DESGLOSE 3: Clúster ECS y Task Definitions (Definición de Tareas)](#4-desglose-3-clúster-ecs-y-task-definitions)
5. [DESGLOSE 4: ECS Services, Target Groups y Load Balancer (ALB)](#5-desglose-4-ecs-services-target-groups-y-load-balancer-alb)
6. [DESGLOSE 5: Base de Datos PostgreSQL (RDS vs Fargate Task)](#6-desglose-5-base-de-datos-postgresql)
7. [DESGLOSE 6: Auto Scaling en ECS (Target Tracking Scaling Policies)](#7-desglose-6-auto-scaling-en-ecs)
8. [DESGLOSE 7: Pipeline CI/CD en GitHub Actions para ECS](#8-desglose-7-pipeline-cicd-en-github-actions-para-ecs)
9. [CUADRO COMPARATIVO DEFENSIVO: EKS vs ECS](#9-cuadro-comparativo-defensivo-eks-vs-ecs)
10. [PASO A PASO CRONOLÓGICO DEFINITIVO ECS (De 0 a 100)](#10-paso-a-paso-cronológico-definitivo-ecs)

---

## 1. RESUMEN EJECUTIVO: ¿Qué cambia entre EKS y ECS?

En lugar de administrar la complejidad de un clúster de Kubernetes (EKS) con nodos EC2, Kubernetes Manifests y NetworkPolicies, la opción **AWS ECS + Fargate** simplifica el modelo operacional:

| Concepto en Kubernetes (EKS) | Equivalente Directo en AWS ECS | Descripción |
| :--- | :--- | :--- |
| **Pod** | **ECS Task (Tarea)** | Uno o varios contenedores corriendo juntos en la misma unidad. |
| **Deployment** | **ECS Service (Servicio)** | Mantiene el número deseado de tareas (réplicas) ejecutándose. |
| **Kubernetes Manifest (YAML)** | **Task Definition (JSON)** | Plantilla donde se especifica la imagen Docker, CPU, RAM y variables de entorno. |
| **HPA (Horizontal Pod Autoscaler)** | **ECS Service Auto Scaling** | Escala tareas usando políticas de seguimiento de métricas de CloudWatch. |
| **Node Group (EC2)** | **AWS Fargate (Serverless)** | No gestionas servidores ni AMI. AWS provisiona el cómputo de forma transparente. |
| **Ingress / Service LoadBalancer** | **Application Load Balancer (ALB)** | Enruta tráfico HTTP/HTTPS mediante *Target Groups* hacia las Tareas. |
| **NetworkPolicy** | **Security Group por Task / Service** | Aislamiento de red mediante firewalls nativos de AWS en cada ENI (Elastic Network Interface). |

---

## 2. DESGLOSE 1: Red y Conectividad

La arquitectura de red para ECS se mantiene estricta y Multi-AZ dentro de la misma VPC:

* **VPC:** `devops-ecs-vpc` (`10.0.0.0/16`)
* **Subredes Públicas (2 AZs):**
  * `devops-public-subnet-1a` (`10.0.1.0/24`) $\rightarrow$ Alberga el **Application Load Balancer (ALB)** y el **NAT Gateway**.
  * `devops-public-subnet-1b` (`10.0.2.0/24`) $\rightarrow$ Alberga la interfaz secundaria redundante del ALB.
* **Subredes Privadas (2 AZs):**
  * `devops-private-subnet-1a` (`10.0.10.0/24`) $\rightarrow$ Alberga las **ECS Tasks del Frontend Nginx** y **Backend Node.js**.
  * `devops-private-subnet-1b` (`10.0.20.0/24`) $\rightarrow$ Alberga la **ECS Task / RDS de PostgreSQL**.
* **Gateways y Ruteo:**
  * **Internet Gateway (IGW):** `0.0.0.0/0` para la tabla pública.
  * **NAT Gateway:** Permite que las ECS Tasks en subredes privadas descarguen paquetes o se comuniquen con ECR sin asignarle IP pública a las tareas.

---

## 3. DESGLOSE 2: Security Groups y Reglas de Entrada/Salida

En ECS, cada servicio o tarea tiene su propio **Security Group dedicado** (Aislamiento Capa 4/7 nativo de AWS):

```
[ INTERNET ]
     │ (Puerto 80/443)
     ▼
┌──────────────────────────────────────────────────────────┐
│ Security Group ALB: devops-alb-sg                        │
│  - Inbound: HTTP 80 / HTTPS 443 desde 0.0.0.0/0          │
└────────────────────────────┬─────────────────────────────┘
                             │ (Puerto 80 y Puerto 5000)
                             ▼
┌──────────────────────────────────────────────────────────┐
│ Security Group ECS Tasks: devops-ecs-tasks-sg            │
│  - Inbound 80: Permitido SOLO desde devops-alb-sg        │
│  - Inbound 5000: Permitido SOLO desde devops-alb-sg      │
└────────────────────────────┬─────────────────────────────┘
                             │ (Puerto 5432)
                             ▼
┌──────────────────────────────────────────────────────────┐
│ Security Group Database: devops-db-sg                    │
│  - Inbound 5432: Permitido SOLO desde devops-ecs-tasks-sg│
└──────────────────────────────────────────────────────────┘
```

---

## 4. DESGLOSE 3: Clúster ECS y Task Definitions

### 4.1 Clúster ECS
* **Nombre:** `devops-ecs-cluster`
* **Capacidad:** `FARGATE` y `FARGATE_SPOT` (Serverless compute engine).

---

### 4.2 Task Definition del Backend (`backend-task-def.json`)
```json
{
  "family": "devops-backend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::571617431105:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::571617431105:role/LabRole",
  "containerDefinitions": [
    {
      "name": "devops-backend-container",
      "image": "571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "PORT", "value": "5000" },
        { "name": "DB_HOST", "value": "database.devops.local" },
        { "name": "DB_PORT", "value": "5432" },
        { "name": "DB_NAME", "value": "devops_db" }
      ],
      "secrets": [
        {
          "name": "DB_USER",
          "valueFrom": "arn:aws:ssm:us-east-1:571617431105:parameter/devops/db_user"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:ssm:us-east-1:571617431105:parameter/devops/db_pass"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/devops-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

### 4.3 Task Definition del Frontend (`frontend-task-def.json`)
```json
{
  "family": "devops-frontend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::571617431105:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "devops-frontend-container",
      "image": "571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/devops-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## 5. DESGLOSE 4: ECS Services, Target Groups y Load Balancer (ALB)

* **Application Load Balancer (ALB):** `devops-ecs-alb` (Público en subredes 1A y 1B).
* **Listeners del ALB:**
  * **Listener Puerto 80 (HTTP):**
    * Regla por defecto $\rightarrow$ Enruta tráfico hacia el **Target Group Frontend** (`devops-frontend-tg`).
    * Regla de ruta `/api/*` $\rightarrow$ Enruta tráfico hacia el **Target Group Backend** (`devops-backend-tg`).

```
                              ┌───────────────────────────┐
                              │  ALB: devops-ecs-alb :80  │
                              └─────────────┬─────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │ Regla Path: /api/*                          │ Regla Path: Default (/*)
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │ Target Group: backend-tg  │                 │ Target Group: frontend-tg │
       │  - Puerto Target: 5000    │                 │  - Puerto Target: 80      │
       │  - HealthCheck: /api/health│                 │  - HealthCheck: /         │
       └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                     │                                             │
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │ ECS Service: backend-srv  │                 │ ECS Service: frontend-srv │
       │  - Launch: Fargate        │                 │  - Launch: Fargate        │
       │  - Tasks: 2 Réplicas      │                 │  - Tasks: 2 Réplicas      │
       └───────────────────────────┘                 └───────────────────────────┘
```

---

## 6. DESGLOSE 5: Base de Datos PostgreSQL

En la opción ECS existen **dos alternativas para la base de datos**:

1. **Opción A (Recomendada en Producción AWS): Amazon RDS PostgreSQL 16**
   * Instancia `db.t4g.micro` en Subredes Privadas 1A y 1B (Multi-AZ).
   * Totalmente administrada por AWS con backups automáticos y cifrado KMS.
2. **Opción B (Equivalente al Pod K8s): ECS Task PostgreSQL en Fargate**
   * Task Definition corriendo `postgres:16-alpine` conectada a un volumen **AWS EFS (Elastic File System)** para conservar la persistencia de datos.

---

## 7. DESGLOSE 6: Auto Scaling en ECS

En lugar de K8s HPA, ECS utiliza **Application Auto Scaling nativo de AWS**:

* **Métrica de seguimiento:** `ECSServiceAverageCPUUtilization` (CloudWatch Metric).
* **Política de Auto-Escalado (Target Tracking):**
  * **Backend Service (`backend-srv`):**
    * Target CPU: **70%**
    * Tareas Mínimas: **2**
    * Tareas Máximas: **5**
    * Cooldown Scale-out: **60 segundos**
  * **Frontend Service (`frontend-srv`):**
    * Target CPU: **75%**
    * Tareas Mínimas: **2**
    * Tareas Máximas: **4**

---

## 8. DESGLOSE 7: Pipeline CI/CD en GitHub Actions para ECS

```yaml
name: CI/CD Pipeline - AWS ECS Fargate

on:
  push:
    branches: [ "main", "master" ]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Backend Tests
        run: |
          cd backend
          npm ci
          npm test -- --passWithNoTests

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push Images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/devops-backend:latest ./backend
          docker push $ECR_REGISTRY/devops-backend:latest
          
          docker build -t $ECR_REGISTRY/devops-frontend:latest ./frontend
          docker push $ECR_REGISTRY/devops-frontend:latest

      - name: Deploy to AWS ECS (Force New Deployment)
        run: |
          aws ecs update-service --cluster devops-ecs-cluster --service backend-srv --force-new-deployment
          aws ecs update-service --cluster devops-ecs-cluster --service frontend-srv --force-new-deployment
```

---

## 9. CUADRO COMPARATIVO DEFENSIVO: EKS vs ECS

Esta tabla es tu **arma magistral para la defensa oral** si la comisión te pregunta: *"¿Por qué eligieron Kubernetes (EKS) y no AWS ECS?"*:

| Criterio | Amazon EKS (Kubernetes) | Amazon ECS (Elastic Container Service) |
| :--- | :--- | :--- |
| **Complejidad de Gestión** | **Alta.** Requiere conocer YAMLs de K8s, Control Plane, kubectl, NetworkPolicies y CRDs. | **Baja.** 100% nativo de AWS, usa JSONs simples y se administra desde la consola estándar de AWS. |
| **Portabilidad / Multi-Cloud** | **MÁXIMA.** Los manifiestos de K8s corren igual en GCP (GKE), Azure (AKS) o en servidores On-Premise. | **BAJA.** Está acoplado al ecosistema de AWS (dificulta migrar a otros proveedores). |
| **Modelo de Servidores** | Requiere Node Groups (EC2) o Karpenter/Fargate en EKS. | Con **AWS Fargate** es 100% Serverless (cero gestión de instancias EC2). |
| **Costo Base del Control Plane** | ~$0.10 USD/hora por clúster (~$72 USD/mes en cuentas no-lab). | **GRATIS.** El plano de control de ECS no tiene costo base en AWS. |
| **Ecosistema y Herramientas** | Enorme (Helm, ArgoCD, Prometheus, Istio, Cert-Manager). | Limitado a integraciones nativas de AWS (CloudWatch, AWS App Mesh, SSM). |
| **Veredicto para la Defensa** | *"Elegimos **EKS** para garantizar portabilidad Multi-Cloud empresarial y dominar la herramienta estándar de la industria (Kubernetes). Sin embargo, reconocemos que **ECS + Fargate** es la opción ideal en AWS si se busca reducir la carga operativa y eliminar el costo del Control Plane."* |

---

## 10. PASO A PASO CRONOLÓGICO DEFINITIVO ECS (De 0 a 100)

### **Etapa 1: Crear VPC y Subredes**
```powershell
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=devops-ecs-vpc}]"
# Crear subredes públicas y privadas (igual que en la etapa 2 de EKS)
```

### **Etapa 2: Crear Clúster ECS**
```powershell
aws ecs create-cluster --cluster-name devops-ecs-cluster --capacity-providers FARGATE FARGATE_SPOT
```

### **Etapa 3: Registrar Task Definitions**
```powershell
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json
```

### **Etapa 4: Crear Application Load Balancer y Target Groups**
```powershell
aws elbv2 create-load-balancer --name devops-ecs-alb --subnets subnet-0662c9236328b212f subnet-0105335a59a4c7aa7 --security-groups sg-alb123
aws elbv2 create-target-group --name devops-backend-tg --protocol HTTP --port 5000 --vpc-id vpc-07772e6acab483468 --target-type ip --health-check-path /api/health
aws elbv2 create-target-group --name devops-frontend-tg --protocol HTTP --port 80 --vpc-id vpc-07772e6acab483468 --target-type ip --health-check-path /
```

### **Etapa 5: Crear Servicios ECS**
```powershell
aws ecs create-service --cluster devops-ecs-cluster --service-name backend-srv --task-definition devops-backend-task --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-0ff56fe4910477203,subnet-06644b3d366c360c2],securityGroups=[sg-tasks456],assignPublicIp=DISABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=devops-backend-container,containerPort=5000"

aws ecs create-service --cluster devops-ecs-cluster --service-name frontend-srv --task-definition devops-frontend-task --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-0ff56fe4910477203,subnet-06644b3d366c360c2],securityGroups=[sg-tasks456],assignPublicIp=DISABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=devops-frontend-container,containerPort=80"
```
