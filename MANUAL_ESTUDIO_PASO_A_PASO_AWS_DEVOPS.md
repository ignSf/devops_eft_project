# 📚 Manual de Estudio Universitario: Guía Práctica de Despliegue de Infraestructura Cloud, EKS y CI/CD en AWS

---

## 1. Introducción y Contexto Histórico: De la Infraestructura Física al Aprovisionamiento Automático en AWS

Durante las primeras décadas de la computación comercial, la provisión de infraestructura para aplicaciones web exigía la adquisición, instalación física y configuración manual de servidores en centros de datos (*On-Premise*). Este proceso tomaba semanas o meses, requiriendo inversiones masivas de capital inicial (*CAPEX*) y generando rigidez ante picos inesperados de demanda. La creación de Amazon Web Services (AWS) en 2006 revolucionó la industria al convertir el cómputo, el almacenamiento y las redes en un modelo de autoservicio bajo demanda por pago de uso (*OPEX*). Sin embargo, el aprovisionamiento manual mediante consolas gráficas (*ClickOps*) introdujo el riesgo de desacoplamiento de configuraciones y falta de repetibilidad. La respuesta de la ingeniería moderna fue el desarrollo de la **Infraestructura como Código (IaC)** y el aprovisionamiento automatizado mediante Interfaces de Línea de Comandos (CLI) y orquestadores declarativos de contenedores como Kubernetes.

### Autores, Tecnólogos y Pioneros de la Infraestructura Cloud

#### **Jeff Bezos**
Jeffrey Preston Bezos es un empresario e ingeniero eléctrico y en computación estadounidense, fundador y Presidente Ejecutivo de Amazon.com. En el año 2002, Bezos emitió la célebre "Proclama de la API" (*The API Mandate*), donde ordenó que todos los equipos de Amazon debían exponer obligatoriamente sus datos y funcionalidades a través de interfaces de servicios (APIs) desacopladas y diseñadas para ser consumidas externamente. Esta directriz arquitectónica transformó la infraestructura interna de Amazon en una plataforma global programable, sentando las bases del lanzamiento de Amazon Web Services en 2006. Su contribución visionaria clave se documenta en las cartas anuales a los accionistas de Amazon (*"Amazon Shareholder Letters"*, 1997–2021).

#### **Andy Jassy**
Andrew R. Jassy es un ejecutivo de negocios estadounidense que se desempeñó como el primer CEO de Amazon Web Services desde su fundación en 2006 hasta 2021, asumiendo posteriormente el cargo de CEO de Amazon.com. Jassy lideró la creación del modelo de negocio de la nube pública de pago por uso, supervisando el diseño de los primeros servicios seminales como Amazon S3 (Simple Storage Service) y Amazon EC2 (Elastic Compute Cloud). Su aporte fundamental consistió en industrializar la provisión elástica de almacenamiento y cómputo virtualizado a nivel global con facturación por segundo. Su obra técnica de referencia reside en la arquitectura original expuesta en la presentación de lanzamiento de AWS en el año 2006.

#### **Brendan Burns**
Brendan Burns es un distinguido ingeniero de software e investigador estadounidense que cofundó el proyecto de código abierto **Kubernetes** en 2014 mientras trabajaba como ingeniero en Google. Burns concibió el modelo de objetos declarativo de Kubernetes y diseñó los algoritmos de control de estado deseado (*Reconciliation Loops*) que permiten a los clústeres automantenerse. Tras su paso por Google, asumió como Vicepresidente de Azure Compute en Microsoft, donde impulsó la estandarización de servicios administrados de Kubernetes como EKS y AKS. Su obra bibliográfica de referencia es el libro *"Designing Distributed Systems: Patterns and Paradigms for Scalable, Reliable Services"* (2018).

#### **Kelsey Hightower**
Kelsey Hightower es un destacado tecnólogo, educador de software y conferencista estadounidense, reconocido mundialmente como uno de los máximos divulgadores de las tecnologías Cloud Native, Linux y Kubernetes. Durante su labor en CoreOS y Google, Hightower desmitificó los componentes internos de los clústeres de contenedores mediante su influyente repositorio y guía de estudio *"Kubernetes The Hard Way"*, la cual enseña a instalar de forma artesanal la red CNI, certificados TLS, `etcd` y el plano de control sin abstracciones automatizadas. Su publicación de referencia es el libro coescrito *"Kubernetes: Up and Running: Dive into the Future of Infrastructure"* (2017).

#### **Mitchell Hashimoto**
Mitchell Hashimoto es un ingeniero de software e inversor estadounidense, cofundador de **HashiCorp** en 2012. Hashimoto es el creador de herramientas fundamentales para el movimiento DevOps e Infraestructura como Código, tales como Vagrant, Packer, Vault, Consul y **Terraform**. Su aporte principal radicó en inventar la sintaxis declarativa HCL (HashiCorp Configuration Language), permitiendo definir estados complejos de redes cloud, VPCs, subredes y clústeres Kubernetes mediante código auditable e inmutable. Su obra técnica de referencia es la primera versión pública del repositorio de *"Terraform Core"* (2014).

#### **Igor Sysoev**
Igor Sysoev es un ingeniero de software ruso, creador del servidor web de alto rendimiento y proxy inverso **Nginx**, lanzado públicamente en 2004. Sysoev diseñó Nginx utilizando una arquitectura impulsada por eventos y asíncrona (*event-driven asynchronous architecture*), a diferencia del modelo de hilos por conexión de Apache HTTP Server. Esta innovación permitió gestionar decenas de miles de conexiones simultáneas (*C10K Problem*) con un consumo insignificante de memoria RAM, convirtiendo a Nginx en el estándar de la industria para servidores web de frontend, terminación SSL y balanceo de carga en contenedores. Su obra de referencia es el código fuente original de *"Nginx Core"* (2004).

#### **Eric Brewer**
Eric A. Brewer es un científico de la computación estadounidense, profesor emérito en la Universidad de California, Berkeley, y Vicepresidente de Infraestructura en Google. Brewer es mundialmente reconocido por formular en el año 2000 el **Teorema CAP** (*CAP Theorem*), el cual demuestra matemáticamente que en un sistema de datos distribuido es imposible garantizar simultáneamente tres propiedades: Consistencia (*Consistency*), Disponibilidad (*Availability*) y Tolerancia a Particiones (*Partition Tolerance*). Su aporte teórico es esencial para la arquitectura de bases de datos relacionales y NoSQL en redes de AWS. Su publicación seminal de referencia es el artículo *"Towards Robust Distributed Systems"* (ACM PODC, 2000).

---

## 2. Núcleo Teórico: Desarrollo Profundo Paso a Paso de la Infraestructura en AWS

### 2.1. Fase 1: Arquitectura de Red Cloud (VPC, Subredes Multi-AZ y Enrutamiento)

**Identificador de VPC (VPC ID)**
El **Identificador de VPC (VPC ID)** es un código alfanumérico único generado por Amazon Web Services (ejemplo: `vpc-07772e6acab483468`) que asigna un espacio de red virtual totalmente privado y aislado dentro de la cuenta `571617431105` en la región `us-east-1` (N. Virginia). Esta VPC define el límite de seguridad perimetral dentro del cual conviven las subredes, tablas de enrutamiento y balanceadores de carga.
*Ejemplo Práctico:* En la ejecución CLI, el comando `aws ec2 create-vpc --cidr-block 10.0.0.0/16` retorna el ID `vpc-07772e6acab483468`, el cual se exporta en la variable de entorno `$env:VPC_ID` para vincular todos los recursos posteriores.

**Soporte DNS de VPC (VPC DNS Resolution & Hostnames)**
El **Soporte DNS de VPC** es una configuración binaria dentro de los atributos de una VPC de AWS (`enableDnsSupport` y `enableDnsHostnames`) que activa la resolución de nombres de dominio internos a través del servidor DNS de Amazon (Route 53 Resolver en `10.0.0.2`) y la asignación automática de nombres FQDN públicos a las instancias de cómputo. Es un requisito técnico obligatorio de Amazon EKS para que los nodos worker puedan descubrir el extremo API público/privado del clúster.
*Ejemplo Práctico:* Se ejecuta `aws ec2 modify-vpc-attribute --vpc-id vpc-07772e6acab483468 --enable-dns-hostnames "{\"Value\":true}"` para garantizar que las instancias EC2 del Node Group obtengan nombres DNS resolventes.

**Subred Pública Multi-AZ**
Una **Subred Pública Multi-AZ** es una división lógica de la VPC asignada a una Zona de Disponibilidad específica (`us-east-1a` o `us-east-1b`) configurada con la bandera `--map-public-ip-on-launch` y una ruta explícita hacia el **Internet Gateway (IGW)**. En la guía técnica, se crearon dos subredes públicas (`subnet-0662c9236328b212f` en `us-east-1a` y `subnet-0105335a59a4c7aa7` en `us-east-1b`) con el tag `kubernetes.io/role/elb=1` para que Kubernetes auto-provisione balanceadores de carga públicos (*AWS Application/Network LoadBalancers*).
*Ejemplo Práctico:* El servicio de frontend expone un LoadBalancer que asigna una dirección IP pública en `subnet-0662c9236328b212f`, permitiendo el tráfico web del usuario desde Internet.

**Subred Privada Multi-AZ**
Una **Subred Privada Multi-AZ** es un segmento de red (`subnet-0ff56fe4910477203` en `us-east-1a` y `subnet-06644b3d366c360c2` en `us-east-1b`) carente de ruta directa hacia el Internet Gateway, destinando su tráfico de salida a través de un **NAT Gateway**. Llevan el tag obligatorio `kubernetes.io/role/internal-elb=1` para la provisión de balanceadores internos.
*Ejemplo Práctico:* Los Pods del microservicio backend y la base de datos PostgreSQL se despliegan en `subnet-0ff56fe4910477203`, aislados de escaneos de puertos no autorizados provenientes de Internet.

**Puerta de Enlace a Internet (Internet Gateway - IGW)**
Una **Puerta de Enlace a Internet (Internet Gateway - IGW)** es un componente de red de AWS altamente disponible, redundante y sin limitaciones de ancho de banda que se adjunta a una VPC (`devops-igw`) para permitir la comunicación bidireccional entre los recursos de las subredes públicas y la red pública de Internet mediante la traducción de direcciones IP privadas a públicas.
*Ejemplo Práctico:* El comando `aws ec2 attach-internet-gateway --internet-gateway-id igw-012345 --vpc-id vpc-07772e6acab483468` habilita el punto de salida hacia Internet para el balanceador del Frontend.

**Puerta de Enlace de Traducción de Direcciones de Red (NAT Gateway)**
Una **Puerta de Enlace de Traducción de Direcciones de Red (NAT Gateway)** es un servicio administrado de red de AWS desplegado en una subred pública que utiliza una dirección IP elástica estática (**Elastic IP - EIP**) para traducir las direcciones IP privadas de los recursos en subredes privadas hacia su IP elástica al realizar peticiones salientes hacia Internet. Esto permite que la base de datos o el backend descarguen paquetes o imágenes de Docker en ECR sin permitir que conexiones iniciadas en Internet ingresen a la subred privada.
*Ejemplo Práctico:* El NAT Gateway `devops-nat-gw` recibe una solicitud saliente del Pod de PostgreSQL en `10.0.10.15` para descargar una actualización, reescribe el paquete con la IP elástica pública y retransmite la respuesta de forma segura.

**Tabla de Ruteo (Route Table)**
Una **Tabla de Ruteo (Route Table)** es un conjunto de reglas asociadas a una o varias subredes que determinan la dirección y el salto de red (*next hop*) hacia donde se debe canalizar el tráfico IP originado en dicha subred. En el proyecto se configuraron dos tablas: `devops-public-rt` (con la ruta `0.0.0.0/0 -> IGW`) y `devops-private-rt` (con la ruta `0.0.0.0/0 -> NAT Gateway`).
*Ejemplo Práctico:* La regla `aws ec2 create-route --route-table-id rtb-0abc123 --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-0xyz789` encamina todo el tráfico no local de las subredes privadas hacia el NAT Gateway.

---

### 2.2. Fase 2: Grupos de Seguridad (Security Groups) y Reglas de Entrada

**Security Group del Control Plane de EKS (`devops-eks-cluster-sg`)**
El **Security Group del Control Plane de EKS (`devops-eks-cluster-sg`)** es una entidad de firewall virtual identificada con el ID `sg-0cdefee98e5f938b6` encargada de proteger las interfaces de red del plano de control administrado por AWS. Su regla de entrada principal restringe el acceso en el puerto **443 (HTTPS)** procedente del bloque CIDR de la VPC (`10.0.0.0/16`), autorizando únicamente a los worker nodes la comunicación segura con el servidor de la API de Kubernetes (*kube-apiserver*).
*Ejemplo Práctico:* Se ejecuta `aws ec2 authorize-security-group-ingress --group-id sg-0cdefee98e5f938b6 --protocol tcp --port 443 --cidr 10.0.0.0/16` para permitir que el agente `kubelet` de los nodos envíe reportes de estado al control plane.

**Security Group de los Nodos Worker (`devops-eks-workers-sg`)**
El **Security Group de los Nodos Worker (`devops-eks-workers-sg`)** es la entidad de seguridad identificada con el ID `sg-0289686b9df8f66b4` que aplica el **Principio de Menor Privilegio** a las instancias EC2 donde residen los Pods de la aplicación. Posee un mapa estricto de puertos abiertos:
1. Puerto **80 (HTTP)** y **443 (HTTPS)** desde `0.0.0.0/0` para el tráfico web del Frontend.
2. Puerto **5000 (TCP)** desde `10.0.0.0/16` para las llamadas REST entre el Frontend y el Backend API.
3. Puerto **5432 (TCP)** desde `10.0.0.0/16` para las conexiones a PostgreSQL.
4. Rango de puertos **1025-65535** referenciando al SG del Control Plane para el tráfico operativo de Kubelet.
*Ejemplo Práctico:* El comando `aws ec2 authorize-security-group-ingress --group-id sg-0289686b9df8f66b4 --protocol tcp --port 5432 --cidr 10.0.0.0/16` garantiza que nadie fuera del rango privado de la VPC pueda conectarse al motor PostgreSQL.

---

### 2.3. Fases 3 y 4: Creación del Clúster Amazon EKS y Grupos de Nodos Worker

**Plano de Control de Amazon EKS (Control Plane)**
El **Plano de Control de Amazon EKS (Control Plane)** es el entorno maestro administrado de Kubernetes en AWS (`devops-eks-cluster`) corriendo la versión de Kubernetes v1.31/v1.36. AWS gestiona de forma transparente la redundancia de los servidores de la API, el programador (*kube-scheduler*), el administrador de controladores (*kube-controller-manager*) y la base de datos de estado `etcd` a través de múltiples Zonas de Disponibilidad.
*Ejemplo Práctico:* Al ejecutar `aws eks create-cluster --name devops-eks-cluster --role-arn arn:aws:iam::571617431105:role/LabRole`, AWS aprovisiona la infraestructura maestra y devuelve la URL del endpoint HTTPS privado/público.

**Grupo de Nodos Administrados (Managed Node Group)**
Un **Grupo de Nodos Administrados (Managed Node Group)** es un recurso de EKS (`devops-worker-nodes`) que automatiza la creación, actualización y eliminación de instancias de computación EC2 (`t3.medium`) basándose en una imagen AMI de Amazon Linux 2023 (`AL2023_x86_64_STANDARD`). Define políticas de escalado elástico mediante los parámetros `minSize=1`, `maxSize=3` y `desiredSize=2`.
*Ejemplo Práctico:* El comando `aws eks create-nodegroup --cluster-name devops-eks-cluster --nodegroup-name devops-worker-nodes --instance-types t3.medium --scaling-config minSize=1,maxSize=3,desiredSize=2` levanta automáticamente dos máquinas EC2 registradas en el clúster.

**Configuración de Autenticación Local (`kubeconfig`)**
La **Configuración de Autenticación Local (`kubeconfig`)** es un archivo YAML ubicado en el directorio local del usuario (`~/.kube/config`) que almacena los certificados TLS, las direcciones de endpoint API y los tokens IAM de autenticación necesarios para que la herramienta CLI `kubectl` se conecte al clúster remoto de AWS EKS.
*Ejemplo Práctico:* Ejecutar `aws eks update-kubeconfig --name devops-eks-cluster --region us-east-1` inyecta las credenciales temporales de AWS IAM en el `kubeconfig`, permitiendo ejecutar comandos `kubectl get nodes`.

---

### 2.4. Fase 5: Registro e Inmutabilidad de Imágenes en Amazon ECR

**Autenticación en Amazon ECR mediante Docker CLI**
La **Autenticación en Amazon ECR mediante Docker CLI** es el proceso de intercambio de tokens donde la CLI de AWS solicita un token de autorización temporal de 12 horas mediante el servicio IAM y lo transmite a través de un tubo (*pipe*) hacia la interfaz de Docker para autorizar los comandos `docker push` y `docker pull`.
*Ejemplo Práctico:* El comando en terminal `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 571617431105.dkr.ecr.us-east-1.amazonaws.com` autentica la sesión de Docker para interactuar con el registro de la cuenta `571617431105`.

**Etiquetado Semántico e Inmutabilidad (Image Tagging)**
El **Etiquetado Semántico e Inmutabilidad (Image Tagging)** es la estrategia de publicación de imágenes de contenedores en ECR donde cada imagen recibe una etiqueta mutable genérica (`latest`) y una etiqueta inmutable vinculada al número de versión o commit de Git (`v1` o `v4.0`). Al activar `--image-tag-mutability IMMUTABLE`, ECR impide que una etiqueta existente sea sobrescrita, garantizando la trazabilidad exacta de lo que corre en producción.
*Ejemplo Práctico:* `docker tag devops-backend:latest 571617431105.dkr.ecr.us-east-1.amazonaws.com/devops-backend:v1` empaqueta la imagen para garantizar que el despliegue en EKS apunte con precisión milimétrica a la versión `v1`.

---

### 2.5. Fase 6: Objetos Kubernetes, Políticas de Red y Escalado Automático (HPA)

**Reclamación de Volumen Persistente (PersistentVolumeClaim - PVC)**
Una **Reclamación de Volumen Persistente (PersistentVolumeClaim - PVC)** es una solicitud de almacenamiento declarativa en Kubernetes (`postgres-pvc`) que solicita espacio en disco de forma dinámica a un proveedor de almacenamiento subyacente (como Amazon EBS `gp2/gp3`). Permite que el Pod de la base de datos PostgreSQL conserve los datos del archivo `init.sql` incluso si el Pod es destruido o reiniciado en otro nodo worker.
*Ejemplo Práctico:* Manifiesto YAML de PostgreSQL que declara un PVC solicitando 5 GiB de almacenamiento persistente; Kubernetes adjunta automáticamente un volumen EBS de AWS al nodo donde corre la base de datos.

**Política de Red (NetworkPolicy)**
Una **Política de Red (NetworkPolicy)** es una especificación de seguridad nativa de Kubernetes que actúa como un micro-firewall a nivel de capa 3/4 dentro del clúster, controlando el flujo de tráfico IP entre Pods según etiquetas lógicas (*podSelector*). En el proyecto se aplicaron dos políticas estrictas:
1. `postgres-network-policy`: Solo permite conexiones en el puerto 5432 provenientes de Pods con la etiqueta `role: backend`.
2. `backend-network-policy`: Solo permite conexiones en el puerto 5000 provenientes de Pods con la etiqueta `role: frontend`.
*Ejemplo Práctico:* Si un usuario intenta enviar tráfico directo desde el Pod del Frontend hacia el Pod de PostgreSQL, la NetworkPolicy intercepta el paquete en el kernel mediante el plugin CNI y lo descarta inmediatamente.

**Servidor de Métricas y Auto-Escalador Horizontal de Pods (Metrics Server & HPA)**
El **Servidor de Métricas (Metrics Server)** es un complemento del clúster que recolecta métricas de consumo de CPU y memoria en tiempo real desde los agentes Kubelet de cada nodo. El **Auto-Escalador Horizontal de Pods (HPA - HorizontalPodAutoscaler)** utiliza estas métricas para ajustar dinámicamente el número de réplicas de los Deployments.
*Ejemplo Práctico:* El manifiesto `hpa.yaml` establece que si el promedio de uso de CPU del backend supera el 70%, el HPA escala automáticamente el Deployment `backend-deployment` de 2 réplicas mínimas a un máximo de 5 réplicas.

```
                    ┌─────────────────────────────────────────┐
                    │      HorizontalPodAutoscaler (HPA)      │
                    └────────────────────┬────────────────────┘
                                         │ Evaluó CPU > 70%
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │   Metrics Server (Recolector Kubelet)   │
                    └────────────────────┬────────────────────┘
                                         │ Escala réplicas
                                         ▼
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
  [ Pod Backend 1 ]               [ Pod Backend 2 ]               [ Pod Backend 3 ]
   (10.0.10.15)                    (10.0.20.22)                    (10.0.10.48)
```

---

## 3. Debates y Críticas: Trade-offs y Posturas Contrapuestas en el Despliegue Cloud

La ejecución práctica de arquitectura en la nube mediante comandos CLI de AWS e infraestructura de Kubernetes plantea debates sobre metodología, operatividad y costos.

### 1. Aprovisionamiento Imperativo CLI vs. Infraestructura como Código (IaC Declarativa con Terraform)
* **La Postura de la CLI / Shell Scripts:** Argumenta que ejecutar comandos `aws ec2` y `aws eks` de forma imperativa brinda visibilidad inmediata, control paso a paso en entornos de laboratorio y ejecución directa sin necesidad de mantener archivos de estado compartidos (*statefiles*).
* **La Postura Crítica de IaC (Terraform / CloudFormation):** Críticos afirman que la ejecución imperativa mediante CLI es propensa al error humano, no es idempotente y dificulta la auditoría de cambios. Utilizar **Terraform** permite definir el estado deseado en archivos `.tf`, generar planes de ejecución (`terraform plan`) y destruir la infraestructura de forma segura mediante un solo comando, evitando el olvido de recursos huérfanos que generen costos no deseados.

### 2. Balanceador de Carga por Servicio (Service LoadBalancer) vs. Ingress Controller Unificado
* **La Postura del Service LoadBalancer:** Utilizar un manifiesto de tipo `spec.type: LoadBalancer` en Kubernetes solicita directamente a AWS la creación de un Classic/Network Load Balancer por cada servicio expuesto. Es la solución más sencilla e intuitiva para entornos iniciales.
* **La Postura Crítica del Ingress Controller (Nginx Ingress / AWS ALB Ingress):** Expertos señalan que crear un LoadBalancer de AWS por cada servicio en Kubernetes es extremadamente costoso (alrededor de $18 USD mensuales por cada ELB provisionado). La mejor práctica en producción es desplegar un **Ingress Controller** único que comparta un solo LoadBalancer de AWS y enrute el tráfico interno mediante reglas basadas en nombres de host o rutas de URL (`/api/` -> backend, `/` -> frontend).

---

## 4. Glosario Técnico Extendido: Los 5 Términos Más Complejos del Despliegue AWS

1. **Plugin de Interfaz de Red de Contenedores de AWS (AWS CNI - Container Network Interface)**
   Un plugin de red altamente especializado para Kubernetes en AWS que asigna direcciones IP secundarias nativas de la VPC de AWS a cada Pod individual dentro del clúster. A diferencia de las redes superpuestas tradicionales (*overlay networks*), AWS CNI permite que los Pods se comuniquen directamente con el rendimiento completo de la red de la VPC sin sobrecarga de encapsulamiento de paquetes.

2. **Endpoint de Acceso Privado/Público del API Server (Cluster API Endpoint Access)**
   Una configuración de seguridad en Amazon EKS que determina si el servidor de la API de Kubernetes (*kube-apiserver*) es accesible únicamente desde el bloque CIDR privado de la VPC, desde direcciones IP públicas de Internet o mediante una modalidad híbrida. Permite asegurar que los comandos administrativos queden restringidos a la red corporativa.

3. **Elastic IP Address (EIP - Dirección IP Elástica)**
   Una dirección IP pública IPv4 estática diseñada para la computación en nube asignada a la cuenta de AWS. A diferencia de las IPs públicas dinámicas que cambian al reiniciar una instancia, una EIP permanece fija y dedicada hasta ser liberada, siendo indispensable para mantener la identidad de salida de un NAT Gateway.

4. **Sonda de Métricas de CPU de Kubernetes (Kubernetes Top Metrics API)**
   Una API de extensión en Kubernetes servida por el `metrics-server` que recolecta y expone métricas temporales de uso de recursos de CPU (expresadas en millicores `m`) y memoria RAM (expresadas en Mebibytes `Mi`) de los Pods y nodos del clúster. Es la fuente de datos leída por los comandos `kubectl top` y por el componente HPA.

5. **Inmutabilidad de Etiquetas de Imagen (Image Tag Mutability)**
   Una característica de seguridad y gobierno de datos en registros como Amazon ECR que impide sobrescribir una etiqueta de imagen Docker existente (`v1.0`). Si un desarrollador intenta subir una nueva imagen utilizando una etiqueta ya registrada, el registro rechaza la transacción, garantizando la trazabilidad auditable del software.
