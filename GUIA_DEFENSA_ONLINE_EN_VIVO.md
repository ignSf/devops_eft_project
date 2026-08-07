# 🖥️ Guía de Defensa Online en Vivo: Inspección por Consola Web AWS, Réplica de Comandos y Verificación en Tiempo Real

Este manual es tu **hoja de ruta en vivo (Cheatsheet) para la presentación online**. Si la comisión o el profesor te pide compartir pantalla y pedirte que **muestres los recursos en la interfaz gráfica (Consola Web de AWS)**, replicar comandos en la terminal, inspeccionar Security Groups, verificar Pods en Kubernetes o probar endpoints, aquí tienes la ruta exacta de clics, comandos y discurso.

---

## 🚀 1. Protocolo de Inicio (Antes de Compartir Pantalla)

Asegúrate de ejecutar esto en tu terminal 2 minutos antes de la llamada o exposición:

```powershell
# 1. Configurar credenciales temporales de AWS en PowerShell (Windows)
$env:AWS_ACCESS_KEY_ID="TU_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY="TU_SECRET_KEY"
$env:AWS_SESSION_TOKEN="TU_SESSION_TOKEN"
$env:AWS_DEFAULT_REGION="us-east-1"

# 2. Verificar conectividad inmediata con AWS
aws sts get-caller-identity

# 3. Conectar kubectl con el clúster EKS de producción
aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1

# 4. Verificar que kubectl responde
kubectl get nodes
```

---

## 🖱️ 2. Guía Clic a Clic en la Interfaz Gráfica (Consola Web de AWS)

Si el profesor te dice: *"Muéstramelo en la interfaz web de AWS"*, sigue esta ruta exacta de clics y navegación:

---

### 🌐 2.1. Cómo mostrar la Red VPC y Subredes Multi-AZ en la Consola
1. En la barra de búsqueda superior de AWS, escribe **`VPC`** y presiona Enter.
2. En el menú lateral izquierdo, haz clic en **`Your VPCs`** (Tus VPCs).
3. Selecciona la VPC denominada **`devops-eks-vpc`** (`vpc-07772e6acab483468`).
4. **👉 PUNTO CLAVE EN PANTALLA:** Abre la pestaña **`Resource Map`** (Mapa de recursos).
   * *Verás un diagrama visual interactivo mostrando cómo la VPC conecta automáticamente las 4 subredes con las tablas de ruteo, el Internet Gateway (`devops-igw`) y el NAT Gateway (`devops-nat-gw`).*
5. En el menú lateral izquierdo, haz clic en **`Subnets`** (Subredes) y filtra por la VPC:
   * Muestra las **2 Subredes Públicas:** `devops-public-subnet-1a` y `devops-public-subnet-1b`.
   * Muestra las **2 Subredes Privadas:** `devops-private-subnet-1a` y `devops-private-subnet-1b`.

#### Alternativa CLI:
```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-07772e6acab483468" \
  --query "Subnets[*].[SubnetId, CidrBlock, AvailabilityZone, Tags[?Key=='Name'].Value|[0]]" \
  --output table
```

> 🗣️ **Discurso en Vivo:** *"Como aprecian en el mapa de recursos de la consola, la VPC `devops-eks-vpc` cuenta con redundancia Multi-AZ entre las zonas us-east-1a y us-east-1b. Las subredes públicas rutean hacia el Internet Gateway, mientras que las subredes privadas donde residen nuestros nodos de Kubernetes canalizan su tráfico saliente mediante el NAT Gateway."*

---

### 🛡️ 2.2. Cómo mostrar los Security Groups y Reglas de Entrada en la Consola
1. En la barra de búsqueda superior, escribe **`EC2`** y presiona Enter.
2. En el menú lateral izquierdo, desplázate hasta la sección **`Network & Security`** y haz clic en **`Security Groups`**.
3. Verás dos Security Groups del proyecto:
   * **`devops-eks-cluster-sg`** (`sg-0cdefee98e5f938b6`) — Protege el Control Plane de EKS.
   * **`devops-eks-workers-sg`** (`sg-0289686b9df8f66b4`) — Protege los Nodos Worker EC2.
4. Selecciona **`devops-eks-workers-sg`** (`sg-0289686b9df8f66b4`).
5. En el panel inferior, haz clic en la pestaña **`Inbound rules`** (Reglas de entrada).
6. **👉 PUNTO CLAVE EN PANTALLA (Señalar con el puntero del mouse cada regla):**
   * **Puerto 80 (HTTP):** Origen `0.0.0.0/0` — Acceso web público al Frontend Nginx.
   * **Puerto 443 (HTTPS):** Origen `0.0.0.0/0` — Acceso web seguro público.
   * **Puerto 5000 (Backend REST API):** Origen `10.0.0.0/16` — Restringido dentro de la VPC.
   * **Puerto 5432 (PostgreSQL DB):** Origen `10.0.0.0/16` — Restringido dentro de la VPC.
   * **Comunicación interna total (-1):** Origen `10.0.0.0/16` — Tráfico entre nodos worker.
7. Luego selecciona **`devops-eks-cluster-sg`** (`sg-0cdefee98e5f938b6`) y muestra:
   * **Puerto 443 (HTTPS):** Origen `10.0.0.0/16` — Solo los worker nodes hablan con el API Server de Kubernetes.

#### Alternativa CLI:
```bash
# Reglas del Security Group de Workers (el más importante de mostrar)
aws ec2 describe-security-groups --group-ids sg-0289686b9df8f66b4 \
  --query "SecurityGroups[0].IpPermissions[*].[IpProtocol, FromPort, ToPort, IpRanges[0].CidrIp]" \
  --output table

# Reglas del Security Group del Control Plane
aws ec2 describe-security-groups --group-ids sg-0cdefee98e5f938b6 \
  --query "SecurityGroups[0].IpPermissions[*].[IpProtocol, FromPort, ToPort, IpRanges[0].CidrIp]" \
  --output table
```

> 🗣️ **Discurso en Vivo:** *"En la pestaña Inbound Rules aplicamos la defensa en profundidad y el principio de menor privilegio. Los puertos 80 y 443 están abiertos a Internet (`0.0.0.0/0`) para el balanceador web del Frontend, mientras que la API REST en el puerto 5000 y la base de datos PostgreSQL en el puerto 5432 aceptan conexiones únicamente desde el bloque CIDR interno `10.0.0.0/16` de la VPC, imposibilitando el acceso directo desde Internet."*

---

### ☸️ 2.3. Cómo mostrar el Clúster EKS y los Nodos en la Consola
1. En la barra de búsqueda superior, escribe **`EKS`** o **`Elastic Kubernetes Service`**.
2. Haz clic en **`Clusters`** y luego abre **`devops-eks-cluster`**.
3. **👉 PUNTOS CLAVE EN PANTALLA (Pestaña por pestaña):**
   * **Pestaña `Overview` (Visión General):** Mostrar la insignia de estado **`ACTIVE`** y la versión de Kubernetes.
   * **Pestaña `Compute` (Cómputo):** Desplázate hacia abajo para mostrar el **Node Group** denominado `devops-worker-nodes` en estado `ACTIVE`, con 2 instancias EC2 `t3.medium` (min=1, max=3, desired=2).
   * **Pestaña `Networking` (Redes):** Mostrar las 4 subredes asociadas y los Security Groups del clúster.
   * **Pestaña `Logging` / `Observability` (Observabilidad):** Mostrar los 5 tipos de registros de auditoría activados en CloudWatch: *API server, Audit, Authenticator, Controller manager, Scheduler*.

#### Alternativa CLI:
```bash
# Estado del clúster
aws eks describe-cluster --name devops-eks-cluster --query "cluster.[name, status, version, endpoint]" --output table

# Estado del Node Group
aws eks describe-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes \
  --query "nodegroup.[nodegroupName, status, scalingConfig, instanceTypes]" --output table

# Nodos conectados a Kubernetes
kubectl get nodes -o wide
```

> 🗣️ **Discurso en Vivo:** *"En la consola de EKS observamos que el plano de control se encuentra en estado ACTIVE. En la pestaña Compute apreciamos el Node Group administrado `devops-worker-nodes` con 2 nodos EC2 t3.medium distribuidos Multi-AZ. Los logs de auditoría están habilitados y enviándose a CloudWatch para trazabilidad."*

---

### 📦 2.4. Cómo mostrar el Registro de Imágenes ECR en la Consola
1. En la barra de búsqueda superior, escribe **`ECR`** o **`Elastic Container Registry`**.
2. En el menú lateral izquierdo, haz clic en **`Private repositories`** (Repositorios privados).
3. Verás dos repositorios: **`devops-backend`** y **`devops-frontend`**.
4. Haz clic sobre **`devops-backend`**.
5. **👉 PUNTO CLAVE EN PANTALLA:**
   * Mostrar la lista de imágenes con las etiquetas **`latest`** y **`v1`** (o `v<número de build>`).
   * Señalar la columna **`Vulnerabilities`** o **`Image scan status`** mostrando el resultado del escaneo automático.

#### Alternativa CLI:
```bash
aws ecr list-images --repository-name devops-backend --output table
aws ecr list-images --repository-name devops-frontend --output table
```

> 🗣️ **Discurso en Vivo:** *"En Amazon ECR almacenamos nuestras imágenes Docker privadas. Cada compilación subida por el pipeline CI/CD recibe una etiqueta `latest` y una etiqueta semántica con el número de build (`v1`, `v2`). El escaneo de vulnerabilidades CVE se ejecuta automáticamente al hacer push gracias a `scanOnPush=true`."*

---

### ⚖️ 2.5. Cómo mostrar el Load Balancer (ELB) en la Consola
1. Ir a **EC2** → Menú lateral sección **`Load Balancing`** → **`Load Balancers`**.
2. Seleccionar el balanceador provisto automáticamente por Kubernetes (de tipo **Network Load Balancer**, anotación `nlb`).
3. Mostrar el **`DNS name`** (URL pública como `a1b2c3...us-east-1.elb.amazonaws.com`).
4. Copiar esa URL y abrirla en el navegador para demostrar que la aplicación responde.

#### Alternativa CLI:
```bash
kubectl get svc frontend -o wide
```

---

### 🔄 2.6. Cómo mostrar el Pipeline CI/CD en GitHub
1. Abre el navegador y ve a **github.com** → Tu repositorio `ignSf/devops_eft_project`.
2. Haz clic en la pestaña **`Actions`** (Acciones).
3. Abre la última ejecución del workflow **"Pipeline CI/CD DevOps EFT (ISY1101)"**.
4. **👉 PUNTOS CLAVE EN PANTALLA:**
   * Mostrar las **3 etapas verdes** (pasaron exitosamente):
     * **🧪 Pruebas Unitarias y Calidad** (ejecuta Jest en Node.js 20).
     * **🐳 Construcción y Publicación de Imágenes Docker** (build + push a ECR con etiquetas `latest` y `v<run_number>`).
     * **🚀 Despliegue Automatizado en Amazon EKS** (ejecuta `kubectl rollout restart`).
   * Expandir los logs de la etapa de **Test** para mostrar `Tests: 4 passed, 4 total`.
5. Ve a **Settings** → **Secrets and variables** → **Actions** para mostrar los secretos configurados:
   * `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`.

> 🗣️ **Discurso en Vivo:** *"Nuestro pipeline de CI/CD en GitHub Actions se gatilla con cada push a la rama main. Primero ejecuta las pruebas unitarias automatizadas con Jest. Si pasan, construye las imágenes Docker multietapa y las publica en Amazon ECR. Finalmente se autentica de forma segura con credenciales cifradas en GitHub Secrets y ejecuta un rollout restart en EKS, desplegando la nueva versión sin tiempo de caída."*

---

## 🐳 3. Cómo mostrar Docker y Docker Compose Local

Si te piden demostrar la contenerización local:

```bash
# 1. Ir a la carpeta del proyecto
cd c:\Users\sours\OneDrive\Escritorio\examenes\devops_eft_project

# 2. Levantar los 3 contenedores locales
docker-compose up -d --build

# 3. Verificar los 3 contenedores corriendo
docker-compose ps
# Deberías ver:
#   devops_postgres_db    - Up (healthy)  - Puerto 5432
#   devops_backend_api    - Up (healthy)  - Puerto 5000
#   devops_frontend_web   - Up            - Puerto 80

# 4. Mostrar los Dockerfiles
type backend\Dockerfile
type frontend\Dockerfile

# 5. Probar la aplicación local en el navegador
# Abrir: http://localhost (Frontend)
# Abrir: http://localhost:5000/api/health (Backend directo)
```

> 🗣️ **Discurso en Vivo:** *"Para el desarrollo local usamos Docker Compose. El archivo `docker-compose.yml` define 3 servicios: la base de datos PostgreSQL 16 con healthcheck `pg_isready`, el backend Express con verificación de salud en `/api/health`, y el frontend Nginx como proxy inverso. Todos corren en la red aislada `devops_internal_network`."*

---

## 🔍 4. Inspección de Kubernetes en Vivo (Pods, Services, HPA, NetworkPolicies)

```bash
# Ver TODOS los recursos de la aplicación de un vistazo
kubectl get pods,svc,deployments,pvc,hpa,networkpolicies -o wide

# Ver detalles del HPA del Backend (escala de 2 a 5 réplicas al 70% CPU)
kubectl get hpa backend-hpa
# Columnas importantes: TARGETS (uso actual vs umbral), MINPODS=2, MAXPODS=5

# Ver detalles del HPA del Frontend (escala de 2 a 4 réplicas al 75% CPU)
kubectl get hpa frontend-hpa

# Ver consumo de CPU y Memoria en tiempo real de cada Pod
kubectl top pods

# Ver las Network Policies activas (micro-segmentación de red)
kubectl get networkpolicies
# Verás:
#   database-network-policy  — Solo pods con label app=devops-backend pueden hablar al puerto 5432
#   backend-network-policy   — Solo pods con label app=devops-frontend pueden hablar al puerto 5000

# Ver detalles de una NetworkPolicy específica
kubectl describe networkpolicy database-network-policy

# Probar los endpoints de producción
curl http://$LB_URL/api/health
curl http://$LB_URL/api/metrics
curl http://$LB_URL/api/tasks
```

> 🗣️ **Discurso en Vivo (HPA):** *"El HorizontalPodAutoscaler `backend-hpa` monitorea el uso de CPU. Si el consumo promedio supera el 70%, escala automáticamente de 2 réplicas mínimas a un máximo de 5. El frontend tiene su propio HPA escalando de 2 a 4 réplicas al 75% de CPU."*

> 🗣️ **Discurso en Vivo (NetworkPolicies):** *"Implementamos micro-segmentación de red con NetworkPolicies. La política `database-network-policy` solo permite ingreso en el puerto 5432 desde Pods con la etiqueta `app: devops-backend`. La política `backend-network-policy` solo permite ingreso en el puerto 5000 desde Pods con la etiqueta `app: devops-frontend`. Esto impide que un Pod comprometido acceda a servicios no autorizados."*

---

## ⚡ 5. Réplica en Vivo ("Live Coding" o Ajustes que pida el profesor)

### 🛠️ Caso 1: "Aumente las réplicas del Backend en vivo"
```bash
kubectl scale deployment/backend-deployment --replicas=5
kubectl get pods -l app=devops-backend -w
# Verás 3 nuevos Pods apareciendo en estado ContainerCreating → Running
```

### 🛠️ Caso 2: "Simule la caída de un Pod para ver Self-Healing"
```bash
# Eliminar un Pod activo del backend
kubectl delete pod -l app=devops-backend --field-selector=status.phase=Running --now

# Kubernetes lo detecta y recrea inmediatamente (observar en vivo)
kubectl get pods -l app=devops-backend -w
```

### 🛠️ Caso 3: "Muéstreme los logs en vivo del Backend"
```bash
kubectl logs deployment/backend-deployment --tail=30 -f
```

### 🛠️ Caso 4: "Añada una regla al Security Group en vivo"
```bash
# Ejemplo: abrir el puerto 8080 desde la VPC
aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 8080 --cidr 10.0.0.0/16
```

### 🛠️ Caso 5: "Haga un rollout restart para simular un despliegue"
```bash
kubectl rollout restart deployment/backend-deployment
kubectl rollout status deployment/backend-deployment
# Verás: "deployment successfully rolled out"
```

---

## 🆘 6. Comandos de Emergencia y Diagnóstico (Troubleshooting)

Si algo falla durante la transmisión en vivo, mantén la calma y ejecuta:

```bash
# Si un Pod dice CrashLoopBackOff o Error — Ver eventos y errores detallados:
kubectl describe pod <NOMBRE_DEL_POD>

# Si la base de datos no conecta — Ver logs de PostgreSQL:
kubectl logs deployment/postgres-deployment --tail=20

# Si la URL del LoadBalancer no abre — Verificar que el Service existe y tiene IP:
kubectl get svc frontend -o wide

# Si kubectl no conecta al clúster — Regenerar kubeconfig:
aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1

# Si los Pods dicen ImagePullBackOff — Verificar que las imágenes existen en ECR:
aws ecr list-images --repository-name devops-backend --output table

# Si el HPA dice <unknown> en la columna TARGETS — Verificar Metrics Server:
kubectl get deployment metrics-server -n kube-system
```
