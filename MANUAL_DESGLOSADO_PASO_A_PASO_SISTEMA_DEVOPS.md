# 📘 Manual Técnico Desglosado y Paso a Paso Completo: Sistema DevOps Cloud AWS EKS

> Este documento es la **guía de desglose absoluto y paso a paso definitivo** de todo el sistema montado en la infraestructura AWS y Docker. Cada recurso, regla, subred, puerto, variable y comando está listado de forma directa, ultra clara y sin omisiones.

---

## 📑 ÍNDICE DE NAVEGACIÓN RÁPIDA

1. [DESGLOSE 1: Red y Conectividad (VPC, Subredes, Gateways, Route Tables)](#1-desglose-1-red-y-conectividad)
2. [<font color="red">MAPA DE DIRECCIONAMIENTO IP Y CHOQUE DE CONEXIONES</font>](#mapa-de-direccionamiento-ip-y-choque-de-conexiones)
3. [DESGLOSE 2: Security Groups y Reglas de Entrada/Salida (Firewalls)](#2-desglose-2-security-groups-y-reglas-de-entrada-y-salida)
4. [DESGLOSE 3: Amazon EKS (Control Plane y Node Groups)](#3-desglose-3-amazon-eks-control-plane-y-node-groups)
5. [<font color="blue">¿EN QUÉ MOMENTO SE CREAN LAS INSTANCIAS EC2?</font>](#en-qué-momento-se-crean-las-instancias-ec2)
6. [DESGLOSE 4: Registro ECR e Imágenes Docker (Contenerización)](#4-desglose-4-registro-ecr-e-imágenes-docker)
7. [DESGLOSE 5: Kubernetes Manifests (Pods, Services, HPAs, NetworkPolicies)](#5-desglose-5-kubernetes-manifests-y-objetos-desplegados)
8. [DESGLOSE 6: Pipeline CI/CD en GitHub Actions (.github/workflows/ci-cd.yml)](#6-desglose-6-pipeline-cicd-en-github-actions)
9. [DESGLOSE 7: Métricas, Observabilidad y Endpoints de Telemetría](#7-desglose-7-métricas-observabilidad-y-endpoints)
10. [DESGLOSE 8: Entorno Local con Docker Compose](#8-desglose-8-entorno-local-con-docker-compose)
11. [PASO A PASO CRONOLÓGICO DEFINITIVO (De 0 a 100) CON EXPLICACIÓN DETALLADA](#9-paso-a-paso-cronológico-definitivo)

---

<font color="blue">

## 🖥️ ¿EN QUÉ MOMENTO SE CREAN LAS INSTANCIAS EC2?

Las instancias físicas/virtuales de EC2 (los servidores donde viven los Pods) **SE CREAN EN LA ETAPA 7**, al ejecutar el comando:

```powershell
aws eks create-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes ...
```

* **Explicación del proceso:**
  1. En las Etapas 1 a 6 creas la "carcasa" (VPC, Subredes, Security Groups y el Control Plane Maestro de EKS). **Hasta aquí NO existe ninguna máquina EC2 cobrando por hora.**
  2. En la **Etapa 7**, al crear el **Node Group**, EKS se conecta internamente al servicio de *Auto Scaling* de AWS y solicita la creación de **2 instancias EC2 `t3.medium`**.
  3. En ese instante exacto nacen las 2 instancias EC2 en el panel de EC2 de AWS, se les asigna su IP privada (`10.0.10.x` y `10.0.20.x`) y se instalan automáticamente los agentes de Kubernetes (`kubelet`).
  4. En las **Etapas 8 y 9**, cuando aplicas los manifiestos de Kubernetes (`kubectl apply`), los Pods se descargan y se instancian dentro de esas máquinas EC2 que acaban de nacer en la Etapa 7.

</font>

---

## 1. DESGLOSE 1: Red y Conectividad

### 1.1 Virtual Private Cloud (VPC)
* **Nombre tag:** `devops-eks-vpc`
* **ID real AWS:** `vpc-07772e6acab483468`
* **Bloque IPv4 CIDR:** `10.0.0.0/16` (Total de 65,536 IPs privadas reservadas)
* **Atributos activados:**
  * `enableDnsSupport`: `true` (Permite resolución de nombres en la red interna)
  * `enableDnsHostnames`: `true` (Asigna nombres DNS a instancias y balanceadores)

<font color="red">

#### ❓ ¿Por qué este rango de IPs (10.0.0.0/16) y no otros?
* El estándar de la IETF (RFC 1918) define tres rangos de direcciones IP privadas que no navegan en el Internet público de forma directa:
  1. `10.0.0.0/8` (Redes grandes)
  2. `172.16.0.0/12` (Redes medianas)
  3. `192.168.0.0/16` (Redes hogareñas)
* Elegimos `10.0.0.0/16` porque proporciona 65,536 direcciones IP organizadas limpiamente en subredes octeto por octeto (`10.0.1.x`, `10.0.2.x`, `10.0.10.x`, `10.0.20.x`), evitando choques con las IPs domésticas habituales (`192.168.x.x`) o de corporaciones que usen la `172.31.x.x`.

</font>

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

<font color="red">

   > ❓ **¿Ese tag `kubernetes.io/role/elb = 1` siempre debe tener ese nombre exacto?**  
   > **SÍ, OBLIGATORIAMENTE.** Es la convención estándar del controlador de Amazon EKS (`AWS Load Balancer Controller`). Cuando creas un Service de tipo `LoadBalancer` en Kubernetes, EKS busca en la VPC las subredes que tengan exactamente esa etiqueta para saber dónde colocar las interfaces del balanceador de carga público. Si no la tiene o está mal escrita, el servicio se queda colgado en estado `<pending>`.

   > ❓ **¿Por qué los balanceadores públicos van en red pública y para qué son?**  
   > Van en la red pública porque necesitan tener una dirección IP accesible desde el Internet público. Su función es recibir a todos los usuarios del mundo que entran a tu sitio web por el puerto 80/443 y distribuir ese tráfico entre los nodos worker que están guardados de forma segura en las subredes privadas.

</font>

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

<font color="red">

   > ❓ **¿Para qué existen los balanceadores internos (`internal-elb`)?**  
   > Existen para comunicar microservicios entre sí de forma privada sin exponer tráfico a Internet. Por ejemplo, si tuvieras un microservicio de pagos y un microservicio de inventario en la red privada, podrías colocar un balanceador interno con la etiqueta `internal-elb` para repartir la carga entre las réplicas del servicio de pagos usando solo direcciones IP privadas (`10.0.x.x`).

</font>

4. **`devops-private-subnet-1b`**
   * **ID:** `subnet-06644b3d366c360c2`
   * **CIDR:** `10.0.20.0/24` (256 IPs) | **AZ:** `us-east-1b`
   * **Tipo:** Privada (MapPublicIpOnLaunch = `false`)
   * **Tags Kubernetes:** `kubernetes.io/role/internal-elb = 1`

---

### 1.3 Gateways y Ruteo

* **Internet Gateway (IGW):**
  * **Nombre:** `devops-igw`
  * **Función:** Conecta la VPC a la red pública de Internet. Es el portal físico bidireccional.
* **NAT Gateway:**
  * **Nombre:** `devops-nat-gw`
  * **Ubicación:** Subred pública `devops-public-subnet-1a` (`10.0.1.0/24`)
  * **Elastic IP (EIP):** IP pública fija asignada por AWS.
  * **Función:** Permite que los servidores en subredes privadas salgan a Internet (descargar paquetes/imágenes) pero **impide** que desde Internet inicien conexiones hacia las subredes privadas.

<font color="red">

> ❓ **¿Por qué el NAT Gateway y el IGW están conectados a la subred pública?**
> * **El IGW** se conecta a la VPC y a la subred pública para darle acceso directo hacia/desde el exterior.
> * **El NAT Gateway** DEBE estar alojado dentro de una subred pública porque necesita usar una IP pública fija (Elastic IP) para enviar peticiones al IGW a nombre de las máquinas privadas. Funciona como un "apoderado" que sale a buscar actualizaciones y vuelve con la información.

</font>

<font color="blue">

> ❓ **¿Dónde creo esas reglas de ruteo? ¿Ya están en la guía?**
> * **SÍ, ya están en la guía (Etapa 4 del manual).** Se configuran en la Consola Web de AWS en **VPC** $\rightarrow$ **Route Tables** $\rightarrow$ Pestaña **Routes** $\rightarrow$ **Edit routes**.
> 
> ❓ **¿Cómo "apunto" al IGW y al NAT Gateway en la interfaz y en la CLI?**
> * **En la Interfaz Consola Web:**
>   1. Al presionar **Add route**, en la columna **Destination** escribes `0.0.0.0/0`.
>   2. En la columna **Target** (Objetivo), haces clic en el menú desplegable:
>      * Para la tabla pública: Seleccionas la opción **Internet Gateway** y haces clic en `devops-igw`.
>      * Para la tabla privada: Seleccionas la opción **NAT Gateway** y haces clic en `devops-nat-gw`.
>   3. Haces clic en **Save changes**.
> * **En la CLI:**
>   * `aws ec2 create-route --route-table-id <ID> --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxxx` (Apunta al IGW).
>   * `aws ec2 create-route --route-table-id <ID> --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-xxxx` (Apunta al NAT Gateway).

</font>

* **Tablas de Ruteo (Route Tables):**
  1. **`devops-public-rt` (Pública):**
     * Regla: `0.0.0.0/0` $\rightarrow$ `devops-igw`
     * Asociada a: `devops-public-subnet-1a` y `devops-public-subnet-1b`
  2. **`devops-private-rt` (Privada):**
     * Regla: `0.0.0.0/0` $\rightarrow$ `devops-nat-gw`
     * Asociada a: `devops-private-subnet-1a` y `devops-private-subnet-1b`

---

<font color="red">

## 🗺️ MAPA DE DIRECCIONAMIENTO IP Y CHOQUE DE CONEXIONES

El siguiente diagrama detalla exactamente las direcciones IP en cada tramo y el punto exacto donde las reglas de red evalúan y permiten o bloquean el flujo de datos:

```
[ NAVEGADOR DE CLIENTE EN INTERNET ] (IP Origen: Ej: 200.54.12.8)
                 │
                 │ 1. Petición HTTP a http://<DNS-NLB>:80
                 ▼
[ INTERNET GATEWAY: devops-igw ] (Entrada a la VPC 10.0.0.0/16)
                 │
                 │ 2. Evalúa Tabla de Ruteo Pública: 0.0.0.0/0 -> IGW
                 ▼
[ NETWORK LOAD BALANCER (NLB) ] (Ubicado en Subredes Públicas 10.0.1.x y 10.0.2.x)
                 │
                 │ 3. Conexión hacia el SG de los Workers (sg-0289686b9df8f66b4)
                 │    Evaluación: ¿Puerto 80 está abierto a 0.0.0.0/0? -> SÍ (Aprobado)
                 ▼
[ NODO WORKER EC2 1 ] (IP Privada: 10.0.10.45 en Subred Privada 1A)
                 │
                 │ 4. Llega al Pod Frontend (Nginx) en puerto 80
                 │    Nginx procesa /api/ y ejecuta proxy_pass http://backend:5000/api/
                 ▼
[ EVALUACIÓN DE NETWORKPOLICY BACKEND ]
                 │    ¿El origen del paquete tiene la etiqueta app=devops-frontend? -> SÍ
                 │    ¿El puerto destino es el 5000? -> SÍ (Aprobado)
                 ▼
[ POD BACKEND REST API ] (IP Privada del Pod: 10.0.10.88)
                 │
                 │ 5. Backend requiere datos y se conecta a database:5432 (10.0.20.100)
                 ▼
[ EVALUACIÓN DE SECURITY GROUP WORKERS EN PUERTO 5432 ]
                 │    ¿La IP de origen (10.0.10.88) está dentro del rango 10.0.0.0/16? -> SÍ
                 ▼
[ EVALUACIÓN DE NETWORKPOLICY DATABASE ]
                 │    ¿El pod que envía la solicitud tiene la etiqueta app=devops-backend? -> SÍ
                 │    ¿El puerto destino es 5432? -> SÍ (Aprobado)
                 ▼
[ POD POSTGRESQL 16 ] (IP Privada: 10.0.20.100 en Subred Privada 1B)
                 │
                 │ 6. Ejecuta SQL Query -> Retorna respuesta por la misma ruta
                 ▼
          [ RESPUESTA EXITOSA ENVIADA AL CLIENTE ]
```

</font>

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

<font color="red">

> ❓ **¿Por qué el Control Plane necesita Security Group y solo 1 regla de entrada?**
> * **Necesita Security Group** porque el API Server de Kubernetes es un servicio web HTTPS expuesto internamente que recibe las instrucciones del clúster.
> * **Tiene 1 sola regla de entrada (Puerto 443)** porque los componentes maestros de Kubernetes únicamente se comunican mediante HTTPS cifrado. No necesita tener abiertos los puertos 80, 5000 ni 5432 porque el Control Plane no ejecuta la aplicación web ni la base de datos.
> * **¿Cómo permite que se comuniquen de forma cifrada?** Mediante el protocolo **TLS/SSL en el puerto 443**. Cuando un nodo worker envía información al maestro, establece un túnel cifrado utilizando certificados digitales X.509 firmados por la Autoridad Certificadora (CA) interna del clúster EKS.

</font>

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

<font color="blue">

> ❓ **Sobre el puerto 5432 y "¿Y el backend?"**
> * La regla del puerto **5432** en el Security Group protege a PostgreSQL.
> * El **Backend** está protegido por la regla del **puerto 5000** (`10.0.0.0/16`). Esta regla le dice a AWS: *"Cualquier petición enviada al puerto 5000 solo será aceptada si viene de una IP privada dentro de la VPC (`10.0.0.0/16`), rechazando cualquier intento directo desde Internet"*.

> ❓ **¿No debe haber una regla de AWS Aurora?**
> * **NO.** AWS Aurora es el servicio de base de datos relacional totalmente administrado por AWS. En este proyecto **NO usamos AWS Aurora**, sino un contenedor con la imagen oficial `postgres:16-alpine` corriendo directamente como un Pod dentro de Kubernetes EKS. Por ende, la regla usa el puerto nativo de PostgreSQL (5432) dentro del Security Group de las instancias worker.

</font>

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

<font color="blue">

> ❓ **Clarificación: "Me refiero a que estábamos subiendo a CloudShell todo"**
> * ¡Excelente aclaración! Al inicio del proyecto, subíamos el archivo ZIP del código a **AWS CloudShell** y ejecutábamos manualmente los comandos `docker build` y `docker push` dentro de CloudShell.
> * **¿Cómo funciona ahora con la automatización de GitHub Actions?**  
>   Ya **NO necesitas usar CloudShell**. Cuando haces `git push origin main` desde VS Code en tu computadora, la plataforma **GitHub Actions** despierta un servidor virtual propio en la nube (un runner `ubuntu-latest`), descarga tu código automáticamente, ejecuta las pruebas unitarias, se autentica en Amazon ECR usando tus GitHub Secrets, compila y sube las imágenes Docker a ECR y refresca EKS. Todo ocurre automáticamente sin abrir CloudShell.

</font>

---

## 5. DESGLOSE 5: Kubernetes Manifests y Objetos Desplegados

---

## 6. DESGLOSE 6: Pipeline CI/CD en GitHub Actions

---

## 7. DESGLOSE 7: Métricas, Observabilidad y Endpoints

---

## 8. DESGLOSE 8: Entorno Local con Docker Compose

---

## 9. PASO A PASO CRONOLÓGICO DEFINITIVO CON EXPLICACIÓN DETALLADA DE COMANDOS

---

### **Etapa 1: Red Base (VPC)**
```powershell
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=devops-eks-vpc}]"
# Retorna: vpc-07772e6acab483468
aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-support "{\"Value\":true}"
aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-hostnames "{\"Value\":true}"
```

---

### **Etapa 2: Subredes Multi-AZ**
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

---

### **Etapa 3: Gateways (IGW y NAT)**
```powershell
# Internet Gateway
aws ec2 create-internet-gateway --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=devops-igw}]"
aws ec2 attach-internet-gateway --internet-gateway-id igw-0123456789abcdef0 --vpc-id vpc-07772e6acab483468

# Elastic IP + NAT Gateway en subred pública 1A
aws ec2 allocate-address --domain vpc --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=devops-nat-eip}]"
aws ec2 create-nat-gateway --subnet-id subnet-0662c9236328b212f --allocation-id eipalloc-0abc123456789 --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=devops-nat-gw}]"
```

---

### **Etapa 4: Tablas de Ruteo**
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

---

### **Etapa 5: Security Groups**
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

---

### **Etapa 6: Aprovisionar Control Plane EKS (~12 min)**
```powershell
aws eks create-cluster --name devops-eks-cluster --kubernetes-version 1.31 --role-arn arn:aws:iam::571617431105:role/LabRole --resources-vpc-config subnetIds=subnet-0662c9236328b212f,subnet-0105335a59a4c7aa7,subnet-0ff56fe4910477203,subnet-06644b3d366c360c2,securityGroupIds=sg-0cdefee98e5f938b6,endpointPublicAccess=true,endpointPrivateAccess=true
aws eks wait cluster-active --name devops-eks-cluster
aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1
```

---

### **Etapa 7: Node Group EC2 (~5 min)**
```powershell
aws eks create-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes --node-role arn:aws:iam::571617431105:role/LabRole --subnets subnet-0662c9236328b212f subnet-0105335a59a4c7aa7 --instance-types t3.medium --scaling-config minSize=1,maxSize=3,desiredSize=2 --ami-type AL2023_x86_64_STANDARD
aws eks wait nodegroup-active --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes
kubectl get nodes -o wide
```

---

### **Etapa 8: Repositorios ECR y Push de Imágenes**
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

---

### **Etapa 9: Despliegue de Kubernetes Manifests**
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

---

### **Etapa 10: Conectar Pipeline CI/CD en GitHub Actions**
```powershell
# Inyectar variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY y AWS_SESSION_TOKEN en GitHub Secrets
git add .
git commit -m "feat: despliegue automatizado listo en EKS"
git push origin main
```
