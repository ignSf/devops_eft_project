# 🖱️ Guía Paso a Paso: Montaje Completo desde la Interfaz Gráfica de AWS y Docker Local desde el IDE

Este documento explica **cómo montar toda la infraestructura del proyecto desde la Consola Web de AWS (interfaz gráfica)** y **cómo levantar Docker Compose localmente desde tu IDE/Terminal en Windows**, paso a paso con capturas mentales de cada pantalla, botón y campo a rellenar.

---

## PARTE 1: MONTAJE LOCAL CON DOCKER COMPOSE (Desde tu IDE / Terminal)

Esta es la forma más rápida de tener el proyecto funcionando en tu máquina para demostrarlo. No necesitas AWS para esto.

---

### Paso L1: Abrir la Terminal en tu IDE

1. Abre **VS Code** (o tu IDE).
2. Abre la carpeta del proyecto: `c:\Users\sours\OneDrive\Escritorio\examenes\devops_eft_project`.
3. Abre la terminal integrada: **Terminal** → **New Terminal** (o `Ctrl + ñ` / `` Ctrl + ` ``).
4. Asegúrate de que **Docker Desktop** esté corriendo (busca el ícono de la ballena Docker en la barra de tareas de Windows). Si no está corriendo, ábrelo y espera a que diga "Docker Desktop is running".

---

### Paso L2: Levantar los 3 Contenedores con Docker Compose

En la terminal del IDE, ejecuta:

```powershell
docker-compose up -d --build
```

**¿Qué hace este comando?**
- `docker-compose`: Invoca el orquestador local que lee el archivo `docker-compose.yml`.
- `up`: Crea e inicia los contenedores definidos.
- `-d`: Modo "detached" (los contenedores corren en segundo plano, no bloquean la terminal).
- `--build`: Fuerza la reconstrucción de las imágenes Docker desde los Dockerfiles antes de iniciar.

**¿Qué ocurre internamente en este orden?**
1. Docker lee `docker-compose.yml` y encuentra 3 servicios: `database`, `backend` y `frontend`.
2. Crea la red virtual `devops_internal_network` (tipo bridge).
3. Crea el volumen `devops_postgres_data_volume` para persistir los datos de PostgreSQL.
4. **Primero** levanta `database` (PostgreSQL 16 Alpine) y espera su healthcheck (`pg_isready`).
5. **Segundo** levanta `backend` (Node.js Express) porque tiene `depends_on: database` con `condition: service_healthy`.
6. **Tercero** levanta `frontend` (Nginx 1.25 Alpine) porque tiene `depends_on: backend`.

---

### Paso L3: Verificar que los 3 Contenedores Están Corriendo

```powershell
docker-compose ps
```

**Deberías ver esto en pantalla:**

```
NAME                   IMAGE                  STATUS                    PORTS
devops_postgres_db     postgres:16-alpine     Up (healthy)              0.0.0.0:5432->5432/tcp
devops_backend_api     devops_eft_..._backend Up (healthy)              0.0.0.0:5000->5000/tcp
devops_frontend_web    devops_eft_..._frontend Up                       0.0.0.0:80->80/tcp
```

Los 3 deben decir **Up**. Si `database` dice **Up (healthy)**, significa que el healthcheck `pg_isready -U devops_user -d devops_db` pasó exitosamente.

---

### Paso L4: Probar la Aplicación Local en el Navegador

Abre tu navegador web y visita:

| URL | Qué verás |
| :--- | :--- |
| **http://localhost** | Dashboard web completo del Frontend con estado de salud, métricas y tabla de tareas |
| **http://localhost:5000/api/health** | JSON con `"status": "UP"`, timestamp de la DB, versión `v4.0-EKS-Live` |
| **http://localhost:5000/api/metrics** | JSON con Uptime en segundos, memoria RSS/Heap en MB |
| **http://localhost:5000/api/tasks** | JSON con las 4 tareas iniciales insertadas por `db.js` en PostgreSQL |

---

### Paso L5: Mostrar los Dockerfiles (si te lo piden)

En la terminal del IDE:
```powershell
# Backend Dockerfile (Multi-Stage Build con hardening)
type backend\Dockerfile

# Frontend Dockerfile (Nginx con reverse proxy)
type frontend\Dockerfile

# Configuración del Proxy Inverso Nginx
type frontend\nginx.conf
```

**Puntos clave que mencionar al mostrarlos:**
- **Backend Dockerfile:** Tiene 2 etapas (`FROM node:20-alpine AS build` y `FROM node:20-alpine AS production`). La primera instala todo y ejecuta `npm test`. La segunda solo copia lo necesario y corre como `USER node` (no root).
- **Frontend Dockerfile:** Usa `nginx:1.25-alpine`. Copia `nginx.conf` y los archivos HTML estáticos.
- **nginx.conf:** La directiva `proxy_pass http://backend:5000/api/;` en la línea `location /api/` redirige las peticiones API hacia el contenedor backend. El nombre `backend` funciona porque Docker Compose resuelve los nombres de servicio como hostnames DNS internos dentro de la red `devops_internal_network`.

---

### Paso L6: Detener y Limpiar (Después de la Demo)

```powershell
# Detener y eliminar todos los contenedores
docker-compose down

# Si quieres eliminar también el volumen de datos de PostgreSQL
docker-compose down -v
```

---

## PARTE 2: MONTAJE EN AWS DESDE LA INTERFAZ GRÁFICA (Consola Web)

Si necesitas recrear la infraestructura en AWS desde la interfaz web (sin CLI), sigue estos pasos exactos en el navegador.

**Prerrequisito:** Inicia sesión en https://console.aws.amazon.com con tu cuenta `571617431105` (`ign.salazarf@duocuc.cl`). Asegúrate de estar en la región **US East (N. Virginia) `us-east-1`** (selector arriba a la derecha).

---

### Paso A1: Crear la VPC

1. Barra de búsqueda → Escribe **`VPC`** → Clic en **VPC**.
2. Menú lateral izquierdo → **`Your VPCs`** → Botón naranja **`Create VPC`**.
3. Rellenar los campos:
   * **VPC settings:** Selecciona **`VPC only`** (no "VPC and more", eso crea todo automático y no te dejaría explicar).
   * **Name tag:** `devops-eks-vpc`
   * **IPv4 CIDR block:** `10.0.0.0/16`
   * **IPv6 CIDR block:** No IPv6 block
   * **Tenancy:** Default
4. Clic en **`Create VPC`** (botón naranja).
5. **IMPORTANTE:** Una vez creada, selecciona la VPC → Menú **`Actions`** → **`Edit VPC settings`**:
   * Marcar ☑ **Enable DNS resolution**
   * Marcar ☑ **Enable DNS hostnames**
   * Clic en **Save**.

---

### Paso A2: Crear las 4 Subredes (2 Públicas + 2 Privadas)

1. Menú lateral izquierdo → **`Subnets`** → Botón **`Create subnet`**.
2. **VPC ID:** Selecciona `devops-eks-vpc` del desplegable.
3. Crear las 4 subredes una por una:

| Nombre | CIDR | AZ | Tipo |
| :--- | :--- | :--- | :--- |
| `devops-public-subnet-1a` | `10.0.1.0/24` | `us-east-1a` | Pública |
| `devops-public-subnet-1b` | `10.0.2.0/24` | `us-east-1b` | Pública |
| `devops-private-subnet-1a` | `10.0.10.0/24` | `us-east-1a` | Privada |
| `devops-private-subnet-1b` | `10.0.20.0/24` | `us-east-1b` | Privada |

4. **IMPORTANTE para las subredes públicas:** Selecciona cada subred pública → **Actions** → **Edit subnet settings** → Marcar ☑ **Auto-assign public IPv4 address** → Save.

---

### Paso A3: Crear y Adjuntar el Internet Gateway (IGW)

1. Menú lateral izquierdo → **`Internet Gateways`** → **`Create internet gateway`**.
2. **Name tag:** `devops-igw` → Clic **Create**.
3. En la página del IGW recién creado → Botón **`Actions`** → **`Attach to VPC`**.
4. Selecciona `devops-eks-vpc` → Clic **Attach**.

---

### Paso A4: Crear el NAT Gateway (para subredes privadas)

1. Menú lateral izquierdo → **`NAT Gateways`** → **`Create NAT Gateway`**.
2. Rellenar:
   * **Name:** `devops-nat-gw`
   * **Subnet:** Selecciona **`devops-public-subnet-1a`** (el NAT vive en una subred pública).
   * **Connectivity type:** Public
   * **Elastic IP allocation ID:** Clic en **`Allocate Elastic IP`** (se asigna una IP fija automáticamente).
3. Clic **Create NAT Gateway**.
4. **Esperar ~2 minutos** hasta que el estado cambie de `Pending` a `Available`.

---

### Paso A5: Crear y Configurar las Tablas de Ruteo

#### Tabla de Ruteo Pública:
1. Menú lateral → **`Route Tables`** → **`Create route table`**.
2. **Name:** `devops-public-rt` | **VPC:** `devops-eks-vpc` → Create.
3. Selecciona la tabla → Pestaña **`Routes`** → **`Edit routes`** → **`Add route`**:
   * **Destination:** `0.0.0.0/0` | **Target:** Selecciona **Internet Gateway** → `devops-igw` → Save.
4. Pestaña **`Subnet associations`** → **`Edit subnet associations`**:
   * Marcar ☑ `devops-public-subnet-1a` y ☑ `devops-public-subnet-1b` → Save.

#### Tabla de Ruteo Privada:
1. **`Create route table`** → **Name:** `devops-private-rt` | **VPC:** `devops-eks-vpc` → Create.
2. Pestaña **`Routes`** → **`Edit routes`** → **`Add route`**:
   * **Destination:** `0.0.0.0/0` | **Target:** Selecciona **NAT Gateway** → `devops-nat-gw` → Save.
3. Pestaña **`Subnet associations`** → **`Edit subnet associations`**:
   * Marcar ☑ `devops-private-subnet-1a` y ☑ `devops-private-subnet-1b` → Save.

---

### Paso A6: Crear los Security Groups

1. Barra de búsqueda → **`EC2`** → Menú lateral → **`Security Groups`** → **`Create security group`**.

#### Security Group del Control Plane:
* **Name:** `devops-eks-cluster-sg`
* **Description:** Security Group para el Control Plane de EKS
* **VPC:** `devops-eks-vpc`
* **Inbound Rules** → Add rule:
  * Type: **Custom TCP** | Port: **443** | Source: **Custom** → `10.0.0.0/16`
* Clic **Create**.

#### Security Group de los Workers:
* **Name:** `devops-eks-workers-sg`
* **Description:** Security Group para los Nodos Worker del Cluster EKS
* **VPC:** `devops-eks-vpc`
* **Inbound Rules** → Add rule (añadir todas estas):

| Type | Port | Source | Motivo |
| :--- | :--- | :--- | :--- |
| HTTP | 80 | `0.0.0.0/0` | Frontend web público |
| HTTPS | 443 | `0.0.0.0/0` | Frontend web seguro |
| Custom TCP | 5000 | `10.0.0.0/16` | Backend API REST (solo VPC) |
| Custom TCP | 5432 | `10.0.0.0/16` | PostgreSQL (solo VPC) |
| All traffic | All | `10.0.0.0/16` | Comunicación interna entre nodos |

* Clic **Create**.

---

### Paso A7: Crear el Clúster Amazon EKS

1. Barra de búsqueda → **`EKS`** → **`Add cluster`** → **`Create`**.
2. **Step 1 - Configure cluster:**
   * **Name:** `devops-eks-cluster`
   * **Kubernetes version:** `1.31` (o la más reciente disponible)
   * **Cluster service role:** Selecciona `LabRole`
3. **Step 2 - Specify networking:**
   * **VPC:** `devops-eks-vpc`
   * **Subnets:** Seleccionar las 4 subredes (2 públicas + 2 privadas)
   * **Security groups:** Seleccionar `devops-eks-cluster-sg`
   * **Cluster endpoint access:** `Public and private`
4. **Step 3 - Configure logging:**
   * Activar los 5 tipos: ☑ API server, ☑ Audit, ☑ Authenticator, ☑ Controller manager, ☑ Scheduler
5. **Step 4 - Review and create** → Clic **Create**.
6. **⏳ Esperar ~12-15 minutos** hasta que el estado cambie de `CREATING` a `ACTIVE`.

---

### Paso A8: Crear el Node Group (Nodos Worker EC2)

1. Dentro de **EKS** → Abre `devops-eks-cluster` → Pestaña **`Compute`** → Botón **`Add Node Group`**.
2. **Step 1 - Configure Node Group:**
   * **Name:** `devops-worker-nodes`
   * **Node IAM role:** Selecciona `LabRole`
3. **Step 2 - Set compute and scaling configuration:**
   * **AMI type:** `Amazon Linux 2023 (AL2023_x86_64_STANDARD)`
   * **Instance types:** `t3.medium`
   * **Disk size:** `20` GiB
   * **Scaling configuration:** Minimum=`1`, Maximum=`3`, Desired=`2`
4. **Step 3 - Specify networking:**
   * **Subnets:** Seleccionar las **2 subredes públicas** (`devops-public-subnet-1a` y `devops-public-subnet-1b`)
5. **Step 4 - Review and create** → Clic **Create**.
6. **⏳ Esperar ~5-8 minutos** hasta que el estado sea `ACTIVE`.

---

### Paso A9: Crear los Repositorios ECR

1. Barra de búsqueda → **`ECR`** → **`Create repository`**.
2. Crear 2 repositorios:

| Repository name | Tag immutability | Scan on push |
| :--- | :--- | :--- |
| `devops-backend` | Mutable | ☑ Enabled |
| `devops-frontend` | Mutable | ☑ Enabled |

---

### Paso A10: Conectar tu Terminal al Clúster y Desplegar

Vuelve a tu IDE/Terminal para ejecutar los últimos pasos (estos NO se pueden hacer desde la interfaz web):

```powershell
# 1. Configurar credenciales AWS en PowerShell
$env:AWS_ACCESS_KEY_ID="TU_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY="TU_SECRET_KEY"
$env:AWS_SESSION_TOKEN="TU_SESSION_TOKEN"
$env:AWS_DEFAULT_REGION="us-east-1"

# 2. Conectar kubectl al clúster EKS
aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1

# 3. Verificar que los nodos están Ready
kubectl get nodes -o wide

# 4. Autenticarse en ECR y subir imágenes Docker
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 571617431105.dkr.ecr.us-east-1.amazonaws.com

docker build -t devops-backend ./backend
docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest

docker build -t devops-frontend ./frontend
docker tag devops-frontend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest

# 5. Crear secreto de base de datos
kubectl create secret generic db-credentials --from-literal=username=devops_user --from-literal=password=devops_pass123

# 6. Desplegar los manifiestos de Kubernetes en orden
kubectl apply -f k8s/database-deployment.yaml
kubectl rollout status deployment/postgres-deployment --timeout=120s

kubectl apply -f k8s/backend-deployment.yaml
kubectl rollout status deployment/backend-deployment --timeout=120s

kubectl apply -f k8s/frontend-deployment.yaml
kubectl rollout status deployment/frontend-deployment --timeout=120s

# 7. Aplicar políticas de red, Metrics Server y HPA
kubectl apply -f k8s/network-policies.yaml
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl apply -f k8s/hpa.yaml

# 8. Obtener la URL pública del LoadBalancer
kubectl get svc frontend -o wide
```

---

## RESUMEN RÁPIDO: ¿Qué se hace desde la interfaz y qué desde la terminal?

| Acción | ¿Interfaz Web? | ¿Terminal/IDE? |
| :--- | :--- | :--- |
| Crear VPC, Subredes, IGW, NAT, Route Tables | ✅ Sí | ✅ Sí (AWS CLI) |
| Crear Security Groups y Reglas de Entrada | ✅ Sí | ✅ Sí (AWS CLI) |
| Crear Clúster EKS y Node Group | ✅ Sí | ✅ Sí (AWS CLI) |
| Crear Repositorios ECR | ✅ Sí | ✅ Sí (AWS CLI) |
| Compilar imágenes Docker y subirlas a ECR | ❌ No | ✅ Solo Terminal |
| Conectar kubectl al clúster EKS | ❌ No | ✅ Solo Terminal |
| Desplegar manifiestos de Kubernetes (Pods, Services, HPA) | ❌ No | ✅ Solo Terminal (`kubectl`) |
| Levantar Docker Compose local | ❌ No | ✅ Solo Terminal/IDE |
| Ver dashboards, status, logs en la consola AWS | ✅ Sí | ✅ Sí (AWS CLI) |
