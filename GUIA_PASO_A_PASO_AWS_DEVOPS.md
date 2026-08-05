# 🏗️ Guía Profesional Completa: Despliegue de Infraestructura AWS + EKS desde CLI

> **Proyecto:** Plataforma DevOps EFT — ISY1101 Duoc UC  
> **Cuenta AWS:** `571617431105` (`ign.salazarf@duocuc.cl`)  
> **VPC ID:** `vpc-07961c4882b2d88f6`  
> **Cluster Security Group:** `sg-0cdefee98e5f938b6` (`devops-eks-cluster-sg`)  
> **Workers Security Group:** `sg-0289686b9df8f66b4` (`devops-eks-workers-sg`)  
> **Subredes Públicas:** `subnet-0662c9236328b212f` (us-east-1a) | `subnet-0105335a59a4c7aa7` (us-east-1b)  
> **Subredes Privadas:** `subnet-0ff56fe4910477203` (us-east-1a) | `subnet-06644b3d366c360c2` (us-east-1b)  
> **Región:** `us-east-1` (N. Virginia)  
> **Arquitectura:** VPC Multi-AZ → EKS → Microservicios (Frontend + Backend + PostgreSQL)

---

## 📋 Prerrequisitos

Antes de ejecutar cualquier comando, asegúrate de tener configuradas las credenciales y las variables de red en tu terminal:

```bash
# Configurar credenciales temporales del Learner Lab y Variables de Red
export AWS_ACCESS_KEY_ID="TU_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="TU_SECRET_KEY"
export AWS_SESSION_TOKEN="TU_SESSION_TOKEN"
export AWS_DEFAULT_REGION="us-east-1"
export VPC_ID="vpc-07961c4882b2d88f6"
export CLUSTER_SG_ID="sg-0cdefee98e5f938b6"
export WORKERS_SG_ID="sg-0289686b9df8f66b4"
export PUBLIC_SUBNET_1A_ID="subnet-0662c9236328b212f"
export PUBLIC_SUBNET_1B_ID="subnet-0105335a59a4c7aa7"
export PRIVATE_SUBNET_1A_ID="subnet-0ff56fe4910477203"
export PRIVATE_SUBNET_1B_ID="subnet-06644b3d366c360c2"

# Verificar identidad
aws sts get-caller-identity
```

> **PowerShell (Windows):** Reemplazar `export` por `$env:AWS_ACCESS_KEY_ID="..."`.

---

## 🌐 FASE 1: Arquitectura de Red (VPC, Subnets, IGW, NAT, Route Tables)

### 1.1 Crear la VPC (Virtual Private Cloud)

La VPC es la red privada virtual aislada donde vivirá toda la infraestructura.

```bash
# Crear VPC con bloque CIDR /16 (65.536 IPs disponibles)
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=devops-eks-vpc},{Key=Project,Value=EFT-DevOps}]" \
  --query "Vpc.VpcId" --output text
```

Tu VPC ID real asignado es `vpc-07961c4882b2d88f6`.

```bash
# Habilitar resolución DNS y hostnames DNS en la VPC (OBLIGATORIO para EKS)
aws ec2 modify-vpc-attribute --vpc-id vpc-07961c4882b2d88f6 --enable-dns-support "{\"Value\":true}"
aws ec2 modify-vpc-attribute --vpc-id vpc-07961c4882b2d88f6 --enable-dns-hostnames "{\"Value\":true}"
```

---

### 1.2 Crear las Subredes (4 Subnets: 2 Públicas + 2 Privadas en Multi-AZ)

Amazon EKS requiere **mínimo 2 subredes en distintas Availability Zones (AZ)**. Para una arquitectura profesional, se crean 4: 2 públicas (para el Load Balancer y los nodos worker) y 2 privadas (para la base de datos y comunicación interna).

#### Subredes Públicas (expuestas a Internet vía Internet Gateway)

```bash
# Subred Pública en AZ us-east-1a (256 IPs)
aws ec2 create-subnet \
  --vpc-id vpc-07961c4882b2d88f6 \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-public-subnet-1a},{Key=kubernetes.io/role/elb,Value=1},{Key=kubernetes.io/cluster/devops-eks-cluster,Value=shared}]" \
  --query "Subnet.SubnetId" --output text

# Subred Pública en AZ us-east-1b (256 IPs)
aws ec2 create-subnet \
  --vpc-id vpc-07961c4882b2d88f6 \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-public-subnet-1b},{Key=kubernetes.io/role/elb,Value=1},{Key=kubernetes.io/cluster/devops-eks-cluster,Value=shared}]" \
  --query "Subnet.SubnetId" --output text
```

```bash
# Habilitar asignación automática de IP pública en las subredes públicas
aws ec2 modify-subnet-attribute --subnet-id subnet-0662c9236328b212f --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id subnet-0105335a59a4c7aa7 --map-public-ip-on-launch
```

#### Subredes Privadas (comunicación interna, base de datos, pods internos)

```bash
# Subred Privada en AZ us-east-1a
aws ec2 create-subnet \
  --vpc-id vpc-07961c4882b2d88f6 \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-private-subnet-1a},{Key=kubernetes.io/role/internal-elb,Value=1},{Key=kubernetes.io/cluster/devops-eks-cluster,Value=shared}]" \
  --query "Subnet.SubnetId" --output text

# Subred Privada en AZ us-east-1b
aws ec2 create-subnet \
  --vpc-id vpc-07961c4882b2d88f6 \
  --cidr-block 10.0.20.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-private-subnet-1b},{Key=kubernetes.io/role/internal-elb,Value=1},{Key=kubernetes.io/cluster/devops-eks-cluster,Value=shared}]" \
  --query "Subnet.SubnetId" --output text
```

---

### 1.3 Crear y Adjuntar Internet Gateway (IGW)

El Internet Gateway permite que las subredes públicas tengan acceso a Internet (necesario para el LoadBalancer de EKS y para que los nodos descarguen imágenes Docker).

```bash
# Crear Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=devops-igw}]" \
  --query "InternetGateway.InternetGatewayId" --output text

# Adjuntar IGW a la VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id <IGW_ID> \
  --vpc-id vpc-07961c4882b2d88f6
```

---

### 1.4 Crear Elastic IP y NAT Gateway (para subredes privadas)

El NAT Gateway permite que los pods y nodos en las **subredes privadas** (como PostgreSQL) puedan descargar paquetes de internet (pull de imágenes Docker) sin estar expuestos públicamente.

```bash
# Asignar una Elastic IP estática para el NAT Gateway
aws ec2 allocate-address --domain vpc \
  --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=devops-nat-eip}]" \
  --query "AllocationId" --output text

# Crear NAT Gateway en la subred PÚBLICA 1A (para dar salida a las privadas)
aws ec2 create-nat-gateway \
  --subnet-id subnet-0662c9236328b212f \
  --allocation-id <EIP_ALLOCATION_ID> \
  --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=devops-nat-gw}]" \
  --query "NatGateway.NatGatewayId" --output text
```

> **Nota:** Esperar ~2 min a que el NAT Gateway pase a estado `available`:
> ```bash
> aws ec2 describe-nat-gateways --nat-gateway-ids <NAT_GW_ID> --query "NatGateways[0].State"
> ```

---

### 1.5 Crear y Configurar Tablas de Ruteo (Route Tables)

#### Tabla de Ruteo Pública (tráfico 0.0.0.0/0 → Internet Gateway)

```bash
# Crear tabla de ruteo pública
aws ec2 create-route-table --vpc-id vpc-07961c4882b2d88f6 \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=devops-public-rt}]" \
  --query "RouteTable.RouteTableId" --output text

# Agregar ruta hacia Internet (0.0.0.0/0 → Internet Gateway)
aws ec2 create-route \
  --route-table-id <PUBLIC_RT_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <IGW_ID>

# Asociar la tabla de ruteo pública a las 2 subredes públicas
aws ec2 associate-route-table --route-table-id <PUBLIC_RT_ID> --subnet-id subnet-0662c9236328b212f
aws ec2 associate-route-table --route-table-id <PUBLIC_RT_ID> --subnet-id subnet-0105335a59a4c7aa7
```

#### Tabla de Ruteo Privada (tráfico 0.0.0.0/0 → NAT Gateway)

```bash
# Crear tabla de ruteo privada
aws ec2 create-route-table --vpc-id vpc-07961c4882b2d88f6 \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=devops-private-rt}]" \
  --query "RouteTable.RouteTableId" --output text

# Agregar ruta hacia Internet vía NAT Gateway (0.0.0.0/0 → NAT)
aws ec2 create-route \
  --route-table-id <PRIVATE_RT_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id <NAT_GW_ID>

# Asociar la tabla de ruteo privada a las 2 subredes privadas
aws ec2 associate-route-table --route-table-id <PRIVATE_RT_ID> --subnet-id subnet-0ff56fe4910477203
aws ec2 associate-route-table --route-table-id <PRIVATE_RT_ID> --subnet-id subnet-06644b3d366c360c2
```

---

### 1.6 Verificar la Arquitectura de Red Completa

```bash
# Listar todas las subredes de la VPC
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-07961c4882b2d88f6" \
  --query "Subnets[*].[SubnetId, CidrBlock, AvailabilityZone, Tags[?Key=='Name'].Value|[0]]" \
  --output table

# Listar tablas de ruteo
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-07961c4882b2d88f6" \
  --query "RouteTables[*].[RouteTableId, Tags[?Key=='Name'].Value|[0]]" \
  --output table
```

---

## 🔐 FASE 2: Grupos de Seguridad (Security Groups)

### 2.1 Security Group del Clúster EKS (Control Plane)

```bash
aws ec2 create-security-group \
  --group-name devops-eks-cluster-sg \
  --description "Security Group para el Control Plane de EKS" \
  --vpc-id vpc-07961c4882b2d88f6 \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=devops-eks-cluster-sg}]" \
  --query "GroupId" --output text
```

Reglas de entrada del Control Plane:
```bash
# Permitir comunicación HTTPS (443) desde los nodos worker hacia el API Server de Kubernetes
aws ec2 authorize-security-group-ingress --group-id sg-0cdefee98e5f938b6 --protocol tcp --port 443 --cidr 10.0.0.0/16
```

### 2.2 Security Group de los Nodos Worker

```bash
aws ec2 create-security-group \
  --group-name devops-eks-workers-sg \
  --description "Security Group para los Nodos Worker del Cluster EKS" \
  --vpc-id vpc-07961c4882b2d88f6 \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=devops-eks-workers-sg}]" \
  --query "GroupId" --output text
```

Reglas de entrada de los nodos worker:
```bash
# Comunicación interna entre nodos worker (todos los puertos, todo protocolo, dentro de la VPC)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol -1 --port -1 --cidr 10.0.0.0/16

# Permitir tráfico HTTP desde Internet al LoadBalancer / Nginx (puerto 80)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 80 --cidr 0.0.0.0/0

# Permitir tráfico HTTPS desde Internet (puerto 443)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 443 --cidr 0.0.0.0/0

# Permitir tráfico del Backend API desde la VPC (puerto 5000)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5000 --cidr 10.0.0.0/16

# Permitir tráfico de PostgreSQL desde la VPC (puerto 5432, principio de mínimo privilegio)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5432 --cidr 10.0.0.0/16

# Permitir comunicación kubelet desde el Control Plane (puertos 1025-65535)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 1025-65535 --source-group sg-0cdefee98e5f938b6

# Permitir SSH para administración (puerto 22, restringir a tu IP en producción real)
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 22 --cidr 0.0.0.0/0
```

### 2.3 Verificar los Security Groups

```bash
aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=vpc-07961c4882b2d88f6" \
  --query "SecurityGroups[*].[GroupId, GroupName, Description]" --output table

# Ver reglas de entrada detalladas del SG de Workers
aws ec2 describe-security-groups --group-ids sg-0289686b9df8f66b4 \
  --query "SecurityGroups[0].IpPermissions[*].[IpProtocol, FromPort, ToPort, IpRanges[0].CidrIp]" --output table
```

---

## ☁️ FASE 3: Creación del Clúster Amazon EKS

### 3.1 Crear el Control Plane de EKS

```bash
aws eks create-cluster \
  --name devops-eks-cluster \
  --kubernetes-version 1.31 \
  --role-arn arn:aws:iam::571617431105:role/LabRole \
  --resources-vpc-config \
    subnetIds=subnet-0662c9236328b212f,subnet-0105335a59a4c7aa7,subnet-0ff56fe4910477203,subnet-06644b3d366c360c2,securityGroupIds=sg-0cdefee98e5f938b6,endpointPublicAccess=true,endpointPrivateAccess=true \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}' \
  --tags Project=EFT-DevOps,Environment=Production
```

> **Nota (Habilitar Métricas/Logs si el clúster ya existía):** Si el clúster ya estaba creado, puedes habilitar los logs de métricas y auditoría en CloudWatch ejecutando:
> ```bash
> aws eks update-cluster-config --name devops-eks-cluster \
>   --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
> ```

> **Tiempo de espera:** El clúster tarda **~10-15 minutos** en pasar de `CREATING` a `ACTIVE`.

```bash
# Monitorear estado del clúster (repetir hasta que diga ACTIVE)
aws eks describe-cluster --name devops-eks-cluster \
  --query "cluster.[name, status, endpoint, version, platformVersion]" --output table

# Esperar automáticamente a que el clúster esté activo
aws eks wait cluster-active --name devops-eks-cluster
echo "¡Clúster EKS ACTIVO!"
```

### 3.2 Configurar kubectl para conectarse al clúster

```bash
# Actualizar kubeconfig local para apuntar al clúster EKS
aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1

# Verificar conexión con Kubernetes
kubectl cluster-info
kubectl get svc
```

---

## 🖥️ FASE 4: Crear el Node Group (Nodos Worker EC2)

Los nodos worker son las máquinas EC2 donde correrán los pods de Kubernetes.

```bash
aws eks create-nodegroup \
  --cluster-name devops-eks-cluster \
  --nodegroup-name devops-worker-nodes \
  --node-role arn:aws:iam::571617431105:role/LabRole \
  --subnets subnet-0662c9236328b212f subnet-0105335a59a4c7aa7 \
  --instance-types t3.medium \
  --scaling-config minSize=1,maxSize=3,desiredSize=2 \
  --disk-size 20 \
  --ami-type AL2023_x86_64_STANDARD \
  --capacity-type ON_DEMAND \
  --tags Project=EFT-DevOps
```

> **Tiempo de espera:** El Node Group tarda **~5-8 minutos** en provisionar las instancias EC2.

```bash
# Monitorear estado del node group
aws eks describe-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes \
  --query "nodegroup.[nodegroupName, status, scalingConfig]" --output table

# Esperar a que esté activo
aws eks wait nodegroup-active --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes

# Verificar que los nodos aparezcan en Kubernetes
kubectl get nodes -o wide
```

---

## 🐳 FASE 5: Registro de Imágenes (Amazon ECR)

### 5.1 Crear repositorios ECR

```bash
# Crear repositorio para el Backend
aws ecr create-repository \
  --repository-name devops-backend \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability MUTABLE \
  --tags Key=Project,Value=EFT-DevOps

# Crear repositorio para el Frontend
aws ecr create-repository \
  --repository-name devops-frontend \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability MUTABLE \
  --tags Key=Project,Value=EFT-DevOps
```

### 5.2 Autenticarse en ECR y subir imágenes

```bash
# Login en ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 571617431105.dkr.ecr.us-east-1.amazonaws.com

# Compilar, etiquetar y subir Backend
docker build -t devops-backend ./backend
docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:v1
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:v1

# Compilar, etiquetar y subir Frontend
docker build -t devops-frontend ./frontend
docker tag devops-frontend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
docker tag devops-frontend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:v1
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:v1
```

### 5.3 Verificar imágenes en ECR

```bash
aws ecr list-images --repository-name devops-backend --query "imageIds[*].[imageTag]" --output table
aws ecr list-images --repository-name devops-frontend --query "imageIds[*].[imageTag]" --output table
```

---

## 🔑 FASE 6: Secretos, Network Policies, Despliegue y Auto-Escalado

### 6.1 Crear el Namespace de Producción (opcional pero profesional)

```bash
kubectl apply -f k8s/namespace.yaml
```

### 6.2 Crear el Secreto de Base de Datos

```bash
kubectl create secret generic db-credentials \
  --from-literal=username=devops_user \
  --from-literal=password=devops_pass123

# Verificar que el secreto fue creado
kubectl get secrets
```

### 6.3 Desplegar los 3 Microservicios (en orden de dependencia)

```bash
# 1. Base de datos primero (incluye PersistentVolumeClaim para persistencia)
kubectl apply -f k8s/database-deployment.yaml

# Esperar a que PostgreSQL esté listo antes de desplegar el backend
kubectl rollout status deployment/postgres-deployment --timeout=120s

# 2. Backend API (depende de la base de datos)
kubectl apply -f k8s/backend-deployment.yaml
kubectl rollout status deployment/backend-deployment --timeout=120s

# 3. Frontend Web + LoadBalancer (depende del backend)
kubectl apply -f k8s/frontend-deployment.yaml
kubectl rollout status deployment/frontend-deployment --timeout=120s
```

### 6.4 Aplicar Network Policies (Segmentación de Red / Mínimo Privilegio)

Las NetworkPolicies restringen la comunicación entre pods:
* **PostgreSQL** solo acepta conexiones desde el **Backend** (puerto 5432).
* **Backend** solo acepta conexiones desde el **Frontend** (puerto 5000).

```bash
kubectl apply -f k8s/network-policies.yaml

# Verificar que las políticas fueron creadas
kubectl get networkpolicies
```

### 6.5 Instalar Metrics Server y Aplicar HorizontalPodAutoscaler (Auto-Escalado e Indicadores IE5)

Para que Kubernetes EKS pueda medir el uso de CPU/Memoria y ejecutar el auto-escalado horizontal (HPA), se debe instalar **Metrics Server**:

```bash
# 1. Instalar Kubernetes Metrics Server (OBLIGATORIO para HPA y Observabilidad en EKS)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verificar que metrics-server esté en estado Ready
kubectl rollout status deployment metrics-server -n kube-system --timeout=120s

# 2. Aplicar Manifiestos HPA (Backend: 2->5 pods al 70% CPU, Frontend: 2->4 pods al 75% CPU)
kubectl apply -f k8s/hpa.yaml

# 3. Verificar recolección de métricas en tiempo real
kubectl get hpa
kubectl top pods
```

### 6.6 Verificar el Estado Completo del Despliegue

```bash
# Estado general de TODOS los recursos desplegados
kubectl get pods,svc,deployments,pvc,hpa,networkpolicies -o wide

# Logs de cada microservicio
kubectl logs deployment/backend-deployment --tail=20
kubectl logs deployment/frontend-deployment --tail=20
kubectl logs deployment/postgres-deployment --tail=20

# Obtener la URL pública del LoadBalancer (puede tardar ~2-3 min en asignarse)
kubectl get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Probar los endpoints desde la terminal
export LB_URL=$(kubectl get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$LB_URL/api/health
curl http://$LB_URL/api/metrics
curl http://$LB_URL/api/tasks
```

---

## ⚙️ FASE 7: Configurar GitHub Actions (CI/CD) con Secretos

### 7.1 Secretos requeridos en GitHub

En tu repositorio de GitHub → **Settings** → **Secrets and variables** → **Actions**, crear:

| Nombre del Secreto | Valor |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Tu Access Key de AWS Student |
| `AWS_SECRET_ACCESS_KEY` | Tu Secret Access Key |
| `AWS_SESSION_TOKEN` | Tu Session Token (si aplica) |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | `571617431105` |
| `DOCKER_HUB_USERNAME` | Tu usuario de Docker Hub (si usas Docker Hub en vez de ECR) |
| `DOCKER_HUB_TOKEN` | Tu token de Docker Hub |

### 7.2 Verificar secretos por CLI (GitHub CLI)

```bash
# Si tienes GitHub CLI instalado (gh):
gh secret list --repo https://github.com/ignSf/devops_eft_project.git
```

---

## 📸 CHECKLIST DEFINITIVO DE CAPTURAS DE PANTALLA (7 Evidencias)

### 📷 Evidencia 1 — Red Cloud VPC, Subredes y Availability Zones (IE4)
> **Consola AWS → VPC → Your VPCs** → Seleccionar `devops-eks-vpc`  
> **Consola AWS → VPC → Subnets** → Filtrar por VPC y mostrar las 4 subredes con sus AZ  
> **Terminal:** `aws ec2 describe-subnets --filters "Name=vpc-id,Values=<VPC_ID>" --output table`

### 📷 Evidencia 2 — Security Groups e Inbound Rules (IE4)
> **Consola AWS → EC2 → Security Groups** → Seleccionar `devops-eks-cluster-sg` y `devops-eks-workers-sg`  
> Expandir pestaña **Inbound Rules** mostrando puertos 80, 443, 5000, 5432, 22 y regla de comunicación interna VPC  
> **Terminal:** `aws ec2 describe-security-groups --group-ids <SG_ID> --output table`

### 📷 Evidencia 3 — Clúster Amazon EKS ACTIVE (IE4)
> **Consola AWS → Amazon EKS → Clusters** → Clúster `devops-eks-cluster` en estado **ACTIVE**  
> Pestaña **Compute** mostrando Node Group `devops-worker-nodes` con 2 nodos  
> Pestaña **Networking** mostrando las subredes y Security Groups asociados  
> **Terminal:** `aws eks describe-cluster --name devops-eks-cluster --output table`

### 📷 Evidencia 4 — Repositorio Git y Estructura del Proyecto (IE1)
> **GitHub.com** → Página principal del repositorio mostrando carpetas `backend/`, `frontend/`, `database/`, `k8s/`, `.github/workflows/`  
> Historial de commits con mensajes semánticos  
> `README.md` renderizado con diagrama de arquitectura

### 📷 Evidencia 5 — Contenerización Local con Docker Compose (IE2)
> **Terminal:** Ejecutar `docker-compose up -d --build` seguido de `docker-compose ps`  
> Mostrar los 3 contenedores (`devops_frontend_web`, `devops_backend_api`, `devops_postgres_db`) en estado `Up (healthy)`

### 📷 Evidencia 6 — Pipeline CI/CD y Registro de Imágenes (IE3)
> **GitHub → Actions** → Workflow exitoso con las 3 etapas verdes (Test, Build & Push, Deploy)  
> Expandir logs de la etapa Test mostrando `4 passed, 4 total` de Jest  
> **GitHub → Settings → Secrets** → Mostrar las variables de entorno configuradas  
> **Consola AWS → ECR** o **Docker Hub** → Repositorios `devops-backend` y `devops-frontend` con tags `latest` y `v1`

### 📷 Evidencia 7 — Aplicación en Producción y Observabilidad (IE5)
> **Navegador Web:** Cargar la URL pública del LoadBalancer (`http://<ELB_URL>` o `http://34.234.88.244`)  
> Mostrar: Badge verde *"Sistema 100% Funcional"*, estado API *"UP"*, métricas de Uptime/Memoria y tabla de tareas PostgreSQL  
> **Terminal:** `curl http://<URL>/api/health` y `curl http://<URL>/api/metrics`

---

## 🧹 FASE 8: Limpieza de Recursos (Post-Presentación)

Ejecutar en orden inverso para no dejar recursos huérfanos y conservar créditos:

```bash
# 1. Eliminar manifiestos de Kubernetes
kubectl delete -f k8s/

# 2. Eliminar Node Group
aws eks delete-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes
aws eks wait nodegroup-deleted --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes

# 3. Eliminar Clúster EKS
aws eks delete-cluster --name devops-eks-cluster
aws eks wait cluster-deleted --name devops-eks-cluster

# 4. Eliminar repositorios ECR
aws ecr delete-repository --repository-name devops-backend --force
aws ecr delete-repository --repository-name devops-frontend --force

# 5. Eliminar NAT Gateway y liberar Elastic IP
aws ec2 delete-nat-gateway --nat-gateway-id <NAT_GW_ID>
aws ec2 release-address --allocation-id <EIP_ALLOCATION_ID>

# 6. Eliminar Security Groups
aws ec2 delete-security-group --group-id sg-0289686b9df8f66b4
aws ec2 delete-security-group --group-id sg-0cdefee98e5f938b6

# 7. Desasociar y eliminar Internet Gateway
aws ec2 detach-internet-gateway --internet-gateway-id <IGW_ID> --vpc-id vpc-07961c4882b2d88f6
aws ec2 delete-internet-gateway --internet-gateway-id <IGW_ID>

# 8. Eliminar Subredes
aws ec2 delete-subnet --subnet-id subnet-0662c9236328b212f
aws ec2 delete-subnet --subnet-id subnet-0105335a59a4c7aa7
aws ec2 delete-subnet --subnet-id subnet-0ff56fe4910477203
aws ec2 delete-subnet --subnet-id subnet-06644b3d366c360c2

# 9. Eliminar Tablas de Ruteo (las custom, no la main)
aws ec2 delete-route-table --route-table-id <PUBLIC_RT_ID>
aws ec2 delete-route-table --route-table-id <PRIVATE_RT_ID>

# 10. Eliminar la VPC
aws ec2 delete-vpc --vpc-id vpc-07772e6acab483468

# 11. Terminar instancia EC2 de producción
aws ec2 terminate-instances --instance-ids i-0263577787d328246

echo "✅ Limpieza completa. Todos los recursos eliminados."
```
