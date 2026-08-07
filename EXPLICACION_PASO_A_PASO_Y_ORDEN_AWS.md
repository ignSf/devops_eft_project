# 📚 Manual de Estudio Universitario: Justificación del Orden Secuencial de Aprovisionamiento, Comandos CLI y Funcionamiento Interno del Sistema en AWS

---

## 1. Introducción y Contexto Histórico: La Grafo de Dependencias y la Topología de Despliegue

En la ingeniería de sistemas distribuidos y la arquitectura de infraestructura en la nube, el proceso de provisión de recursos no es un conjunto arbitrario de comandos aislados, sino la construcción ordenada de un **Grafo de Dependencias Causal** (*Causal Dependency Graph*). Históricamente, en los centros de datos tradicionales, la construcción de plataformas obedecía a un orden físico estricto: primero se construía el edificio y las canalizaciones de fibra óptica, luego se montaban los racks y fuentes de poder, posteriormente se instalaban los switches y enrutadores de red, y finalmente se montaban los servidores físicos para instalar los sistemas operativos y las aplicaciones. 

Al trasladar este modelo a la nube de Amazon Web Services (AWS) mediante la interfaz de línea de comandos (CLI) o herramientas de Infraestructura como Código (IaC), este principio físico de **Provisión de Infraestructura de Abajo hacia Arriba (Bottom-Up Infrastructure Provisioning)** se mantiene intacto. Intentar crear un clúster de Kubernetes como Amazon EKS sin antes haber configurado la Virtual Private Cloud (VPC), las subredes Multi-AZ y los grupos de seguridad equivale conceptualmente a intentar instalar un servidor web en el aire sin disponer de cables de red ni electricidad.

### Autores, Tecnólogos y Teóricos de la Arquitectura de Sistemas

#### **Leslie Lamport**
Leslie Lamport es un matemático, científico de la computación e investigador estadounidense, galardonado con el Premio Turing de la ACM en 2013. Lamport es pionero en la formulación de los fundamentos teóricos de los sistemas distribuidos, habiendo creado el concepto de **Relojes Lógicos de Lamport** (*Lamport Timestamps*) y la relación de causalidad "sucedió antes que" (*happened-before relation*). Su aporte teórico es la piedra angular que justifica por qué las operaciones de despliegue en la nube deben ejecutarse en un orden cronológico y causal estricto para evitar condiciones de carrera (*race conditions*) e inestabilidades en el estado de los recursos. Su obra seminal de referencia es el artículo *"Time, Clocks, and the Ordering of Events in a Distributed System"* (Communications of the ACM, 1978).

#### **Joe Beda**
Joe Beda es un ingeniero de software estadounidense, cofundador del proyecto de código abierto **Kubernetes** en Google junto a Brendan Burns y Craig McLuckie, y creador original de **Google Compute Engine (GCE)**. Beda concibió la arquitectura desacoplada de Kubernetes donde los planos de control dependen de capas de red virtualizadas previas para establecer la comunicación entre agentes `kubelet`. Su contribución fundamental radicó en abstraer el cómputo distribuido manteniendo una estricta jerarquía de dependencias entre objetos de red y primitivas de almacenamiento. Su publicación clave de referencia es el libro coescrito *"Kubernetes: Up and Running"* (2017).

#### **Adrian Cockcroft**
Adrian Cockcroft es un destacado arquitecto de software e ingeniero británico, que se desempeñó como Vicepresidente de Estrategia de Arquitectura Cloud en Amazon Web Services y previamente como Cloud Architect en Netflix. Cockcroft fue el principal responsable de liderar la migración histórica del monolito de Netflix hacia la nube de AWS, popularizando las arquitecturas de microservicios altamente disponibles orientadas a eventos y la ingeniería del caos (*Chaos Engineering*). Su trabajo demostró cuantitativamente que la correcta segmentación de redes privadas y la ordenación de despliegues resilientes son indispensables para sobrevivir a fallos de Zonas de Disponibilidad. Su obra de referencia se documenta en las ponencias *"Netflix Architecture Overview"* (AWS re:Invent, 2013).

#### **Christopher Alexander**
Christopher Alexander fue un renombrado arquitecto, teórico y profesor universitario austríaco-estadounidense en la Universidad de California, Berkeley. Alexander es célebre por inventar el concepto de **Lenguaje de Patrones** (*Pattern Language*), una metodología formal para resolver problemas recurrentes de diseño mediante estructuras jerárquicas y dependencias ordenadas. Aunque su trabajo original fue desarrollado para la arquitectura urbana, su pensamiento influyó directamente en la ingeniería de software y la infraestructura Cloud, justificando por qué las soluciones tecnológicas complejas deben construirse mediante la composición secuencial de patrones simples. Su obra cumbre de referencia es el libro *"A Pattern Language: Towns, Buildings, Construction"* (1977).

#### **W. Edwards Deming**
William Edwards Deming fue un estadístico, profesor universitario y consultor de gestión estadounidense, pionero en la formulación del control de calidad total y el **Ciclo de Deming** (Planificar-Hacer-Verificar-Actuar / PDCA). Su aporte a la ingeniería DevOps radica en la premisa de que la calidad de un producto o sistema es el resultado directo de la repetibilidad y la consistencia del proceso que lo construye. En el despliegue de infraestructura AWS, el cumplimiento estricto del orden secuencial garantiza la auditabilidad del proceso y elimina la variabilidad en los entornos de producción. Su obra bibliográfica clave de referencia es el libro *"Out of the Crisis"* (1982).

#### **James Lewis**
James Lewis es un destacado consultor técnico, arquitecto de software y miembro del Consejo Técnico de ThoughtWorks. Junto a Martin Fowler, Lewis redactó en 2014 el artículo definitorio que formalizó el término y los límites de la arquitectura de **Microservicios**. Su contribución conceptual principal al despliegue Cloud radica en definir la descentralización del gobierno de datos y la necesidad de aislar la infraestructura de soporte (redes y bases de datos) antes de orquestar la lógica de negocio en contenedores. Su publicación de referencia es el ensayo *"Microservices: a definition of this new architectural term"* (2014).

---

## 2. Núcleo Teórico: Justificación del ORDEN y Comandos Ejecutados Paso a Paso

### 2.1. Justificación Técnica y Comandos CLI del ORDEN Secuencial (La Cadena Causal)

La construcción de la infraestructura AWS y el clúster EKS para el proyecto (`devops_eft_project`) sigue una secuencia de 10 etapas estrictas donde cada paso satisface los prerrequisitos técnicos de la etapa subsiguiente.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ORDEN SECUENCIAL DE APROVISIONAMIENTO                           │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ FASE 1: VPC ] ──► [ FASE 2: Subredes ] ──► [ FASE 3: IGW & NAT ] ──► [ FASE 4: Route Tables ]
         │
         ▼
  [ FASE 5: Security Groups ] ──► [ FASE 6: EKS Control Plane ] ──► [ FASE 7: Node Groups EC2 ]
         │
         ▼
  [ FASE 8: ECR Repositories ] ──► [ FASE 9: K8s Manifests (DB -> Back -> Front) ] ──► [ FASE 10: CI/CD ]
```

---

#### **Paso 0: Autenticación e Inicialización de Variables de Entorno**
* **¿Por qué primero?:** Antes de invocar cualquier orden sobre las APIs de AWS, se deben exportar las credenciales de sesión IAM y definir los nombres de las variables globales que se reutilizarán en los comandos posteriores.
* **Comandos Ejecutados (Linux / Bash / PowerShell):**
  ```bash
  # En Linux/Bash:
  export AWS_ACCESS_KEY_ID="ASI..."
  export AWS_SECRET_ACCESS_KEY="wJalr..."
  export AWS_SESSION_TOKEN="IQoJb..."
  export AWS_DEFAULT_REGION="us-east-1"
  
  # Validar la identidad activa contra AWS IAM
  aws sts get-caller-identity
  ```
  *(En Windows PowerShell se utiliza `$env:AWS_ACCESS_KEY_ID="..."`)*.

---

#### **Paso 1: Creación de la VPC (`devops-eks-vpc`)**
* **¿Por qué este paso aquí?:** La **Virtual Private Cloud (VPC)** es el contenedor padre de toda la red virtual. Define el rango primario de direcciones IP privadas (`10.0.0.0/16`). Si la VPC no existe en AWS, es técnicamente imposible asignar subredes, tarjetas de red virtuales o asociar grupos de seguridad.
* **Comandos Ejecutados:**
  ```bash
  # 1. Crear la VPC con bloque CIDR /16 (65,536 IPs privadas)
  aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=devops-eks-vpc},{Key=Project,Value=EFT-DevOps}]" \
    --query "Vpc.VpcId" --output text
  # Retorna el VPC ID asignado: vpc-07772e6acab483468

  # 2. Habilitar la resolución DNS interna y los nombres DNS públicos (OBLIGATORIO para EKS)
  aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-support "{\"Value\":true}"
  aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-hostnames "{\"Value\":true}"
  ```

---

#### **Paso 2: Segmentación de Subredes Multi-AZ (Públicas y Privadas)**
* **¿Por qué este paso aquí?:** Una vez creado el espacio global de 65,536 IPs de la VPC, este debe dividirse en bloques `/24` (256 IPs) asignados a Zonas de Disponibilidad físicas específicas (`us-east-1a` y `us-east-1b`). EKS exige un mínimo de dos Zonas de Disponibilidad para alta disponibilidad.
* **Comandos Ejecutados:**
  ```bash
  # Subred Pública 1A en us-east-1a
  aws ec2 create-subnet \
    --vpc-id vpc-07772e6acab483468 \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-public-subnet-1a},{Key=kubernetes.io/role/elb,Value=1}]" \
    --query "Subnet.SubnetId" --output text
  # Retorna: subnet-0662c9236328b212f

  # Subred Pública 1B en us-east-1b
  aws ec2 create-subnet \
    --vpc-id vpc-07772e6acab483468 \
    --cidr-block 10.0.2.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-public-subnet-1b},{Key=kubernetes.io/role/elb,Value=1}]" \
    --query "Subnet.SubnetId" --output text
  # Retorna: subnet-0105335a59a4c7aa7

  # Habilitar asignación automática de IP pública en subredes públicas
  aws ec2 modify-subnet-attribute --subnet-id subnet-0662c9236328b212f --map-public-ip-on-launch
  aws ec2 modify-subnet-attribute --subnet-id subnet-0105335a59a4c7aa7 --map-public-ip-on-launch

  # Subred Privada 1A en us-east-1a (para Backend y PostgreSQL)
  aws ec2 create-subnet \
    --vpc-id vpc-07772e6acab483468 \
    --cidr-block 10.0.10.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-private-subnet-1a},{Key=kubernetes.io/role/internal-elb,Value=1}]" \
    --query "Subnet.SubnetId" --output text
  # Retorna: subnet-0ff56fe4910477203

  # Subred Privada 1B en us-east-1b
  aws ec2 create-subnet \
    --vpc-id vpc-07772e6acab483468 \
    --cidr-block 10.0.20.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=devops-private-subnet-1b},{Key=kubernetes.io/role/internal-elb,Value=1}]" \
    --query "Subnet.SubnetId" --output text
  # Retorna: subnet-06644b3d366c360c2
  ```

---

#### **Paso 3: Creación del Internet Gateway (IGW) y NAT Gateway**
* **¿Por qué este paso aquí?:** Las subredes públicas requieren el **Internet Gateway (IGW)** para conectarse con Internet. Las subredes privadas requieren el **NAT Gateway** para descargar imágenes y parches sin recibir tráfico no solicitado. El NAT Gateway exige estar alojado dentro de una subred pública ya creada (`subnet-0662c9236328b212f`) y poseer una **Elastic IP** asignada.
* **Comandos Ejecutados:**
  ```bash
  # 1. Crear y Adjuntar el Internet Gateway (IGW)
  aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=devops-igw}]" \
    --query "InternetGateway.InternetGatewayId" --output text
  # Retorna: igw-0123456789abcdef0

  aws ec2 attach-internet-gateway --internet-gateway-id igw-0123456789abcdef0 --vpc-id vpc-07772e6acab483468

  # 2. Reservar Elastic IP para el NAT Gateway
  aws ec2 allocate-address --domain vpc \
    --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=devops-nat-eip}]" \
    --query "AllocationId" --output text
  # Retorna: eipalloc-0abc123456789

  # 3. Crear el NAT Gateway en la Subred Pública 1A
  aws ec2 create-nat-gateway \
    --subnet-id subnet-0662c9236328b212f \
    --allocation-id eipalloc-0abc123456789 \
    --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=devops-nat-gw}]" \
    --query "NatGateway.NatGatewayId" --output text
  # Retorna: nat-0xyz987654321
  ```

---

#### **Paso 4: Tablas de Ruteo (Route Tables) y Asociación**
* **¿Por qué este paso aquí?:** Con la VPC, subredes, IGW y NAT Gateway creados, se deben escribir las reglas de enrutamiento IP. La tabla pública direcciona `0.0.0.0/0` al IGW; la tabla privada direcciona `0.0.0.0/0` al NAT Gateway.
* **Comandos Ejecutados:**
  ```bash
  # 1. Tabla de Ruteo Pública (salida a Internet directa)
  aws ec2 create-route-table --vpc-id vpc-07772e6acab483468 \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=devops-public-rt}]" \
    --query "RouteTable.RouteTableId" --output text

  aws ec2 create-route --route-table-id rtb-public123 --destination-cidr-block 0.0.0.0/0 --gateway-id igw-0123456789abcdef0
  aws ec2 associate-route-table --route-table-id rtb-public123 --subnet-id subnet-0662c9236328b212f
  aws ec2 associate-route-table --route-table-id rtb-public123 --subnet-id subnet-0105335a59a4c7aa7

  # 2. Tabla de Ruteo Privada (salida vía NAT Gateway)
  aws ec2 create-route-table --vpc-id vpc-07772e6acab483468 \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=devops-private-rt}]" \
    --query "RouteTable.RouteTableId" --output text

  aws ec2 create-route --route-table-id rtb-private456 --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-0xyz987654321
  aws ec2 associate-route-table --route-table-id rtb-private456 --subnet-id subnet-0ff56fe4910477203
  aws ec2 associate-route-table --route-table-id rtb-private456 --subnet-id subnet-06644b3d366c360c2
  ```

---

#### **Paso 5: Definición de Grupos de Seguridad (Security Groups)**
* **¿Por qué este paso aquí?:** Los **Security Groups** son las reglas de firewall a nivel de interfaz virtual. Se deben crear antes de invocar la creación del clúster EKS, ya que el comando `aws eks create-cluster` exige pasar las IDs de los Security Groups en sus parámetros de red.
* **Comandos Ejecutados:**
  ```bash
  # 1. Security Group para el Control Plane de EKS
  aws ec2 create-security-group \
    --group-name devops-eks-cluster-sg \
    --description "Security Group para el Control Plane de EKS" \
    --vpc-id vpc-07772e6acab483468 \
    --query "GroupId" --output text
  # Retorna: sg-0cdefee98e5f938b6

  # Permitir comunicación HTTPS (443) desde la VPC hacia el API Server
  aws ec2 authorize-security-group-ingress --group-id sg-0cdefee98e5f938b6 --protocol tcp --port 443 --cidr 10.0.0.0/16

  # 2. Security Group para los Nodos Worker EC2
  aws ec2 create-security-group \
    --group-name devops-eks-workers-sg \
    --description "Security Group para los Nodos Worker del Cluster EKS" \
    --vpc-id vpc-07772e6acab483468 \
    --query "GroupId" --output text
  # Retorna: sg-0289686b9df8f66b4

  # Reglas de Entrada: 80 (HTTP Web), 443 (HTTPS), 5000 (Backend API), 5432 (PostgreSQL DB) y Kubelet
  aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 80 --cidr 0.0.0.0/0
  aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 443 --cidr 0.0.0.0/0
  aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5000 --cidr 10.0.0.0/16
  aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5432 --cidr 10.0.0.0/16
  aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol -1 --port -1 --cidr 10.0.0.0/16
  ```

---

#### **Paso 6: Aprovisionamiento del Control Plane de Amazon EKS**
* **¿Por qué este paso aquí?:** El plano de control maestro de Kubernetes (`devops-eks-cluster`) requiere la VPC, las subredes Multi-AZ y el Security Group del clúster ya instanciados. AWS tarda ~10-15 minutos en desplegar el servidor de API y la base de datos `etcd`.
* **Comandos Ejecutados:**
  ```bash
  # 1. Lanzar la creación del clúster EKS v1.31
  aws eks create-cluster \
    --name devops-eks-cluster \
    --kubernetes-version 1.31 \
    --role-arn arn:aws:iam::571617431105:role/LabRole \
    --resources-vpc-config subnetIds=subnet-0662c9236328b212f,subnet-0105335a59a4c7aa7,subnet-0ff56fe4910477203,subnet-06644b3d366c360c2,securityGroupIds=sg-0cdefee98e5f938b6,endpointPublicAccess=true,endpointPrivateAccess=true \
    --tags Project=EFT-DevOps

  # 2. Bloquear la terminal hasta que el clúster pase de CREATING a ACTIVE (~12 minutos)
  aws eks wait cluster-active --name devops-eks-cluster

  # 3. Generar el archivo kubeconfig local para conectar kubectl al clúster
  aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1
  ```

---

#### **Paso 7: Creación del Node Group de Instancias EC2 (`devops-worker-nodes`)**
* **¿Por qué este paso aquí?:** Los nodos de trabajo (instancias `t3.medium`) ejecutan el agente `kubelet` que debe autenticarse contra el Control Plane. Si el clúster EKS no está en estado `ACTIVE`, las máquinas EC2 fallarán al conectarse al API Server.
* **Comandos Ejecutados:**
  ```bash
  # 1. Crear el grupo de nodos administrados EC2 t3.medium (min=1, max=3, deseado=2)
  aws eks create-nodegroup \
    --cluster-name devops-eks-cluster \
    --nodegroup-name devops-worker-nodes \
    --node-role arn:aws:iam::571617431105:role/LabRole \
    --subnets subnet-0662c9236328b212f subnet-0105335a59a4c7aa7 \
    --instance-types t3.medium \
    --scaling-config minSize=1,maxSize=3,desiredSize=2 \
    --ami-type AL2023_x86_64_STANDARD \
    --capacity-type ON_DEMAND

  # 2. Esperar confirmación de despliegue de nodos EC2 (~5 minutos)
  aws eks wait nodegroup-active --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes

  # 3. Verificar que los nodos responden en Kubernetes
  kubectl get nodes -o wide
  ```

---

#### **Paso 8: Creación de Repositorios ECR y Push de Imágenes**
* **¿Por qué este paso aquí?:** Las imágenes Docker (`devops-backend:latest` y `devops-frontend:latest`) deben estar compiladas y alojadas en el registro privado **Amazon ECR** antes de solicitar a Kubernetes que las despliegue.
* **Comandos Ejecutados:**
  ```bash
  # 1. Crear repositorios ECR con escaneo de seguridad activado
  aws ecr create-repository --repository-name devops-backend --image-scanning-configuration scanOnPush=true
  aws ecr create-repository --repository-name devops-frontend --image-scanning-configuration scanOnPush=true

  # 2. Autenticar Docker CLI en Amazon ECR
  aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 571617431105.dkr.ecr.us-east-1.amazonaws.com

  # 3. Compilar, etiquetar y subir Backend
  docker build -t devops-backend ./backend
  docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
  docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:v1
  docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
  docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:v1

  # 4. Compilar, etiquetar y subir Frontend
  docker build -t devops-frontend ./frontend
  docker tag devops-frontend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
  docker tag devops-frontend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:v1
  docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
  docker push 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:v1
  ```

---

#### **Paso 9: Despliegue de Manifiestos de Kubernetes en Orden Causal Interno**
* **¿Por qué este paso aquí y en esta secuencia interna?:**
  1. `namespace.yaml` & `secrets`: Crean el espacio conceptual y las claves Base64.
  2. `database-deployment.yaml`: Monta el disco EBS (`postgres-pvc`) e inicia PostgreSQL primero.
  3. `backend-deployment.yaml`: El backend de Node.js arranca en segundo lugar; requiere que PostgreSQL ya responda en `postgres-service:5432`.
  4. `frontend-deployment.yaml`: El frontend web de Nginx se despliega al final y solicita el `LoadBalancer` de AWS.
  5. `network-policies.yaml` & `hpa.yaml`: Aplican la micro-segmentación y habilitan el auto-escalado.
* **Comandos Ejecutados:**
  ```bash
  # 1. Namespace y Secretos
  kubectl apply -f k8s/namespace.yaml
  kubectl create secret generic db-credentials --from-literal=username=devops_user --from-literal=password=devops_pass123

  # 2. Base de Datos (esperar a que esté lista)
  kubectl apply -f k8s/database-deployment.yaml
  kubectl rollout status deployment/postgres-deployment --timeout=120s

  # 3. Backend API (esperar a que esté listo)
  kubectl apply -f k8s/backend-deployment.yaml
  kubectl rollout status deployment/backend-deployment --timeout=120s

  # 4. Frontend Web (esperar asignación de LoadBalancer AWS)
  kubectl apply -f k8s/frontend-deployment.yaml
  kubectl rollout status deployment/frontend-deployment --timeout=120s

  # 5. Políticas de Red e Instalación de Metrics Server para HPA
  kubectl apply -f k8s/network-policies.yaml
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  kubectl apply -f k8s/hpa.yaml

  # 6. Obtener URL pública asignada por AWS LoadBalancer
  kubectl get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
  ```

---

#### **Paso 10: Automatización de Pipeline CI/CD en GitHub Actions**
* **¿Por qué al final?:** El pipeline de integración y entrega continua presupone la existencia de la red, los repositorios ECR, el clúster EKS y los Secretos de GitHub (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). Su función es actualizar la aplicación ante cada `git push main`.
* **Comandos Ejecutados (Comprobación local de Git / GitHub CLI):**
  ```bash
  # 1. Verificar los secretos inyectados en GitHub Actions
  gh secret list --repo https://github.com/ignSf/devops_eft_project.git

  # 2. Enviar cambios a main para gatillar el workflow de 3 etapas (.github/workflows/ci-cd.yml)
  git add .
  git commit -m "feat: actualiza insignia v4.0 neon glowing en EKS"
  git push origin main
  ```

---

### 2.2. Funcionamiento del Sistema MIENTRAS SE MONTA (Dinámica Temporal de Aprovisionamiento)

Durante los ~30 minutos que toma la ejecución completa de los scripts de aprovisionamiento, la infraestructura evoluciona dinámicamente en el tiempo:

```
[ Minuto 0:00 - 2:00 ]   AWS asigna bloque CIDR 10.0.0.0/16 en la VPC vpc-07772e6acab483468.
                         Se crean las 4 subredes e interfaces de red lógicas.
                             │
[ Minuto 2:00 - 5:00 ]   Se asigna la Elastic IP estática y el NAT Gateway devops-nat-gw pasa a estado 'available'.
                         Las tablas de ruteo quedan enlazadas.
                             │
[ Minuto 5:00 - 18:00 ]  AWS provisiona en background los servidores etcd y API Server de EKS.
                         El comando 'aws eks wait cluster-active' bloquea la terminal hasta verificar estado ACTIVE.
                             │
[ Minuto 18:00 - 25:00 ] EKS lanza instancias EC2 t3.medium. Kubelet arranca en cada máquina,
                         se autentica vía IAM y ejecuta 'kubectl get nodes' mostrando estado 'Ready'.
                             │
[ Minuto 25:00 - 28:00 ] Docker local compila los Dockerfiles multietapa y sube imágenes a ECR 571617431105.
                             │
[ Minuto 28:00 - 30:00 ] Kubernetes procesa manifiestos: 
                         PostgreSQL monta el volumen EBS -> Backend conecta a DB -> Frontend recibe URL LoadBalancer.
```

---

### 2.3. Funcionamiento del Sistema UNA VEZ MONTADO (Flujo Operativo de Vida en Producción)

Una vez que el sistema está completamente desplegado y en estado estacionario de producción, el procesamiento de la información sigue un flujo de datos desacoplado y altamente seguro:

```
   [ Usuario en Internet ]
              │ Petición HTTP GET http://34.234.88.244
              ▼
   [ AWS LoadBalancer / Subred Pública ] (Puerto 80)
              │ Evaluado por Security Group: sg-0289686b9df8f66b4
              ▼
   [ Pod Frontend Nginx / Subred Privada ]
              │ Procesa activo estático index.html / Proxy hacia /api/
              │ Interceptado y aprobado por backend-network-policy
              ▼
   [ Pod Backend Express API / Subred Privada ] (Puerto 5000)
              │ Ejecuta lógica JS en Node.js / Consulta SQL vía db.js
              │ Interceptado y aprobado por postgres-network-policy (Puerto 5432)
              ▼
   [ Pod PostgreSQL DB / Subred Privada ] (Puerto 5432)
              │ Lee/Escribe en volumen persistente EBS (postgres-pvc)
              ▼
   [ Respuesta JSON serializada de retorno hacia el Navegador del Usuario ]
```

1. **Entrada de Tráfico:** El usuario abre el navegador e ingresa la dirección IP/DNS del **LoadBalancer de AWS** en la subred pública.
2. **Filtrado Perimetral:** El paquete atraviesa el **Security Group de Workers** (`sg-0289686b9df8f66b4`), que confirma que el puerto de entrada es el 80.
3. **Servidor Web y Proxy Inverso:** El tráfico llega a una de las réplicas del Pod de **Frontend Nginx**. Nginx sirve los activos estáticos HTML/JS. Si la petición es hacia `/api/tasks`, la regla de proxy inverso de Nginx reescribe la petición y la canaliza internamente hacia el servicio `backend-service:5000`.
4. **Validación de Política de Red:** La **NetworkPolicy** del backend analiza la etiqueta del Pod emisor (`role: frontend`). Al coincidir la regla de entrada, autoriza el paso del paquete IP.
5. **Lógica de Negocio y Base de Datos:** El microservicio de **Node.js Express** procesa la petición y ejecuta una consulta SQL mediante el módulo de conexión `db.js`. La conexión busca la dirección IP del `postgres-service:5432`.
6. **Persistencia en Disco:** La **NetworkPolicy** de PostgreSQL valida que la llamada provenga exclusivamente del backend (`role: backend`). El motor relacional PostgreSQL procesa la consulta y escribe los cambios en el volumen en la nube **AWS EBS** montado mediante la **PersistentVolumeClaim**.
7. **Respuesta y Monitoreo:** La respuesta retorna en formato JSON serializado hacia el navegador. En paralelo, el **Metrics Server** recolecta el consumo de CPU de la API; si el uso supera el 70%, el **HPA** ordena a EKS instanciar un nuevo Pod de backend automáticamente.

---

## 3. Debates y Críticas: Trade-offs de Ordenamiento y Arquitectura

El diseño e implementación de esta secuencia operativa plantea importantes debates de arquitectura de software en la industria.

### 1. Base de Datos en Contenedor con PVC vs. Servicio Administrado de Base de Datos (AWS RDS PostgreSQL)
* **La Postura del Contenedor con PVC (Implementada en el proyecto):** Desplegar PostgreSQL como un Pod dentro del clúster EKS utilizando un volumen de almacenamiento `PersistentVolumeClaim` (EBS) reduce drásticamente los costos de infraestructura en entornos educativos o de prueba, y permite gestionar la base de datos con los mismos manifiestos de Kubernetes que la aplicación.
* **La Postura Crítica de RDS Administrado:** Arquitectos senior de AWS sostienen que ejecutar bases de datos relacionales dentro de Kubernetes introduce riesgos operativos severos. Los Pods son volátiles y se destruyen con frecuencia; si un nodo EC2 falla, el proceso de re-adjuntar un volumen EBS a un nuevo Pod en otra Zona de Disponibilidad puede tomar varios minutos. En producción real, la mejor práctica es utilizar **Amazon RDS PostgreSQL**, un servicio de base de datos administrado fuera del clúster con respaldos automáticos, failover Multi-AZ instantáneo y parches de seguridad automatizados por AWS.

### 2. Despliegue Imperativo Manual por CLI vs. Automatización GitOps (ArgoCD / Flux)
* **La Postura del Despliegue por CLI / GitHub Actions (Implementada en el proyecto):** El pipeline push-based tradicional compila las imágenes y ejecuta `kubectl apply` desde GitHub Actions. Es una aproximación directa y fácil de auditar en repositorios medianos.
* **La Postura de GitOps (ArgoCD):** La metodología GitOps promueve un enfoque *pull-based* donde un agente instalado dentro del clúster de Kubernetes (como ArgoCD) monitorea constantemente el repositorio de Git. Si se detecta un cambio en los manifiestos de Kubernetes, el agente sincroniza el estado deseado desde dentro del clúster, eliminando la necesidad de almacenar credenciales de administración de AWS dentro de los secretos de GitHub Actions, mejorando la postura de seguridad.

---

## 4. Glosario Técnico Extendido: Los 5 Términos Más Complejos del Flujo y Secuencia

1. **Grafo de Dependencias Causal (Causal Dependency Graph)**
   Un modelo de representación de estructuras de datos donde los nodos representan recursos o tareas de infraestructura (VPC, Subredes, EKS, Pods) y las aristas dirigidas representan relaciones de dependencia causal estricta. Garantiza que ningún recurso dependiente sea instanciado antes de que su prerrequisito se encuentre en estado operativo confirmado.

2. **Bucle de Reconciliación de Estado (Reconciliation Loop)**
   El algoritmo interno fundamental que ejecutan de forma continua los controladores de Kubernetes y Amazon EKS. Compara permanentemente el **Estado Deseado** (*Desired State*) declarado en los manifiestos YAML con el **Estado Actual** (*Current State*) de la infraestructura en la nube; si detecta una discrepancia (ej. un Pod colapsado), ejecuta acciones correctivas automáticas para restaurar la convergencia del sistema.

3. **Reclamación Dinámica de Almacenamiento (Dynamic Storage Provisioning)**
   El proceso automatizado en Kubernetes mediante el cual la creación de un objeto `PersistentVolumeClaim` desencadena una llamada a la API del proveedor de la nube (AWS EC2) para provisionar de forma transparente un volumen de almacenamiento en bloque (Amazon EBS `gp2/gp3`) y adjuntarlo dinámicamente al nodo físico donde se programa el Pod.

4. **Conmutación de Proxy Inverso Nginx (Nginx Reverse Proxy Pass-Through)**
   El mecanismo de capa 7 (aplicación) configurado en el archivo `nginx.conf` del frontend mediante la directiva `proxy_pass http://backend-service:5000;`. Intercepta las solicitudes HTTP dirigidas al puerto web 80 bajo la ruta `/api/` y las retransmite a través de la red interna del clúster hacia el microservicio backend, ocultando la topología interna del sistema al usuario final.

5. **Métrica de Utilización Relativa de CPU en Millicores (Millicore CPU Utilization)**
   La unidad de medida utilizada por el Kubernetes Metrics Server y el HPA para cuantificar el consumo de procesamiento de un contenedor. Un core completo de CPU equivale a 1000 millicores (`1000m`). Una especificación de `cpu: 100m` indica que el Pod tiene reservada la décima parte de un núcleo de procesamiento virtual de la instancia EC2.
