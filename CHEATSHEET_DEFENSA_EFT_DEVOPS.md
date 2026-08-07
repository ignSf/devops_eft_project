# 🛡️ CHEATSHEET MAESTRO DE DEFENSA ORAL Y PRESENTACIÓN DEVOPS (EFT)

Este documento contiene la **secuencia exacta, comandos clave, arquitectura de red y respuestas técnicas** para obtener la calificación máxima en tu presentación del proyecto **Plataforma DevOps ISY1101 (Duoc UC)**.

---

## 🖥️ 1. PANTALLAS QUE DEBES TENER ABIERTAS (Tu "Cockpit")

Antes de iniciar la presentación ante los profesores/comisión, abre estas **4 pestañas**:

| Pestaña | Propósito | Enlace / Ubicación |
| :--- | :--- | :--- |
| 🌐 **1. Sitio Web en Vivo** | Demostración visual del sistema | `http://a12f917bf7b6540e8a370f143a5ca913-6c014957b9381074.elb.us-east-1.amazonaws.com` |
| 🚀 **2. GitHub Actions (CI/CD)** | Evidencia de Automatización Pipeline | Repositorio GitHub $\rightarrow$ Pestaña **Actions** |
| 🐳 **3. Amazon ECR** | Registro de Imágenes OCI | Consola AWS $\rightarrow$ **ECR** (`test-devops-backend-ecr`) |
| 💻 **4. Terminal de Comandos** | Verificación en vivo K8s | PowerShell / AWS CloudShell |

---

## 🔒 2. GRUPOS DE SEGURIDAD (SECURITY GROUPS) Y REGLAS DE ENTRADA

Para garantizar la seguridad y comunicación correcta entre el plano de control y los worker nodes, se utilizan dos Security Groups estructurados:

### 🛡️ A. Security Group del Clúster / Control Plane (`SG-TEST-EKS-CLUSTER`)
* **Propósito:** Proteger la API de Kubernetes y permitir la comunicación con los nodos worker.
* **Reglas de Entrada (Inbound Rules):**

| Tipo | Protocolo | Puerto | Origen (Source) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **HTTPS** | TCP | 443 | `10.0.0.0/16` | Acceso seguro a la API de Kubernetes desde la VPC |
| **Todo el tráfico** | ALL | ALL | `10.0.0.0/16` | Comunicación bidireccional entre el plano de control y Kubelet |

---

### 🛡️ B. Security Group de los Nodos Worker (`devops-eks-workers-sg`)
* **Propósito:** Permitir tráfico al Load Balancer y la comunicación interna de microservicios.
* **Reglas de Entrada (Inbound Rules):**

| Tipo | Protocolo | Puerto | Origen (Source) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP** | TCP | 80 | `0.0.0.0/0` | Tráfico web público hacia el Load Balancer |
| **HTTPS** | TCP | 443 | `0.0.0.0/0` | Tráfico web seguro público |
| **Custom TCP** | TCP | 5000 | `10.0.0.0/16` | Comunicación interna con el API REST Backend |
| **Custom TCP** | TCP | 5432 | `10.0.0.0/16` | Comunicación interna con la Base de Datos PostgreSQL |
| **Todo el tráfico** | ALL | ALL | `10.0.0.0/16` | Tráfico inter-nodo y red de pods (VPC-CNI) |

---

## 🏷️ 3. ETIQUETAS (TAGS) Y CONFIGURACIÓN CRÍTICA DE SUBREDES VPC

> [!IMPORTANT]
> **⚠️ RECORDATORIO CRÍTICO DE REDES:**
> Antes de crear el Node Group o desplegar balanceadores, debes ir en AWS a **VPC $\rightarrow$ Subredes**, seleccionar las **2 Subredes PÚBLICAS**, hacer clic en **Acciones $\rightarrow$ Editar configuración de subred** y **ACTIVAR la opción: "Habilitar la asignación automática de direcciones IP IPv4 públicas"**.
> Si esto no se activa, las instancias EC2 del Node Group darán el error `Ec2SubnetInvalidConfiguration`.

---

### 🌐 Subredes PÚBLICAS (`PROYECTO-TEST-subnet-public1` y `public2`):

* **Configuración obligatoria:** **Asignación automática de IP pública activada (`Enable auto-assign public IPv4 address`)**.
* **Etiquetas (Tags):**

| Clave (Key) | Valor (Value) | Propósito Obligatorio |
| :--- | :--- | :--- |
| `kubernetes.io/role/elb` | **`1`** | **Le indica a EKS que cree aquí los Load Balancers públicos** |
| `kubernetes.io/cluster/CLUSTER-EKS-TEST-REAL` | `shared` (o `owned`) | Asocia la subred al clúster específico |

---

### 🔒 Subredes PRIVADAS (`PROYECTO-TEST-subnet-private1` y `private2`):

* **Configuración obligatoria:** Ruta por la **NAT Gateway (`0.0.0.0/0 -> nat-xxxxxxxx`)**.
* **Etiquetas (Tags):**

| Clave (Key) | Valor (Value) | Propósito Obligatorio |
| :--- | :--- | :--- |
| `kubernetes.io/role/internal-elb` | **`1`** | **Le indica a EKS que cree aquí los Load Balancers internos** |
| `kubernetes.io/cluster/CLUSTER-EKS-TEST-REAL` | `shared` (o `owned`) | Asocia la subred al clúster específico |

---

## 🎙️ 4. PITCH DE INTRODUCCIÓN (60 Segundos)

> *"Estimada comisión, presentamos la **Plataforma DevOps ISY1101**. Diseñamos una arquitectura cloud nativa, altamente disponible y resiliente sobre **AWS EKS**, automatizada mediante un pipeline de **CI/CD en GitHub Actions** y containerizada con **Docker**.*
>
> *Nuestra infraestructura sigue el principio de menor privilegio con **Subredes Privadas, NAT Gateways y NetworkPolicies de Kubernetes**, garantizando la inmutabilidad del código desde el commit hasta el despliegue en producción con **Autoescalado Horizontal (HPA)**."*

---

## 💻 5. COMANDOS INFALIBLES PARA DEMOSTRAR EN TERMINAL

Ejecuta estos 5 comandos secuenciales para impresionar a la comisión:

### 1️⃣ Demostrar la infraestructura de Nodos EC2 (Cómputo Multi-AZ):
```bash
kubectl get nodes -o wide
```
* **Qué decir:** *"Aquí vemos nuestros 2 Nodos Worker en EC2 `t3.medium` en estado `Ready`, repartidos en dos Zonas de Disponibilidad distintas en AWS."*

### 2️⃣ Demostrar los Microservicios en Ejecución (Pods):
```bash
kubectl get pods -o wide
```
* **Qué decir:** *"Los 3 componentes (Frontend, Backend REST API y PostgreSQL 16) se encuentran en estado `Running` sin reinicios de fallos."*

### 3️⃣ Demostrar el Balanceador de Carga Público (NLB):
```bash
kubectl get svc frontend
```
* **Qué decir:** *"Kubernetes aprovisionó automáticamente un Elastic Load Balancer (ELB/NLB) en AWS que distribuye el tráfico hacia los pods web."*

### 4️⃣ Demostrar el Autoescalado Horizontal (HPA):
```bash
kubectl get hpa
```
* **Qué decir:** *"Monitoreamos el consumo de CPU en tiempo real. Si la carga supera el 50%, el clúster escala automáticamente de 2 a 5 réplicas."*

### 5️⃣ Demostrar la Seguridad de Red (Zero Trust):
```bash
kubectl get networkpolicies
```
* **Qué decir:** *"Implementamos NetworkPolicies de Kubernetes para asegurar que la base de datos solo acepte tráfico proveniente del Backend."*

---

## 🙋‍♂️ 6. PREGUNTAS TÍPICAS DE LA COMISIÓN Y RESPUESTAS EXACTAS

### ❓ P1: ¿Por qué usaron Kubernetes (EKS) y no instancias EC2 simples?
* **Respuesta:**  
  *"Las instancias EC2 requieren gestión manual de parches y no autoescalan por contenedores individuales. Con EKS obtenemos **orquestación declarativa, auto-sanación de pods (self-healing), cero tiempo de inactividad (RollingUpdates)** y gestión inmutable de microservicios."*

### ❓ P2: ¿Cómo manejan la seguridad de las claves y contraseñas?
* **Respuesta:**  
  *"Aplicamos el principio de **Shift-Left Security**. Las claves nunca se escriben en el código fuente ni en los Dockerfiles. En desarrollo usamos archivos `.env` y en producción usamos objetos **Kubernetes Secrets (`db-credentials`)** combinados con **GitHub Secrets**."*

### ❓ P3: ¿Qué pasa si una instancia EC2 o un Pod falla repentinamente?
* **Respuesta:**  
  *"Kubernetes posee controladores de **Self-Healing (Auto-recuperación)**. Si un pod cae, el controlador lo reinicia en milisegundos. Si falla una máquina EC2 completa, el clúster migra automáticamente los pods a la otra instancia sin interrumpir el servicio al usuario."*

### ❓ P4: ¿Cómo garantizan que la imagen de Docker sea ligera y segura?
* **Respuesta:**  
  *"Utilizamos **Multi-Stage Builds** en los Dockerfiles sobre imágenes base de **Linux Alpine**. Esto reduce el peso final de las imágenes de 1 GB a solo 50 MB, reduciendo la superficie de posibles vulnerabilidades y acelerando el despliegue."*

---

## 🛠️ 7. PLAN DE RESCATE EN VIVO (Troubleshooting)

Si algo no carga durante la presentación, mantén la calma y usa esta solución de 5 segundos:

* **Si la terminal da error de conexión:**
  ```bash
  aws eks update-kubeconfig --name CLUSTER-EKS-TEST-REAL --region us-east-1
  ```
* **Si la base de datos o el backend no responden:**
  ```bash
  kubectl apply -f k8s/
  ```
* **Si quieres reiniciar los Pods suavemente:**
  ```bash
  kubectl rollout restart deployment/backend-deployment
  ```

---

🏆 **¡Con este Cheatsheet tienes el control total de tu defensa!** 🚀
