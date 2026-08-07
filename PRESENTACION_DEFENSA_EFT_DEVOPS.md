# 🎤 Guía Magistral de Presentación y Defensa Oral EFT (ISY1101)
## 🚀 Plataforma DevOps Cloud: Arquitectura Multicapa, CI/CD, Docker Hardening y Orquestación Resiliente en AWS EKS

Este documento es tu **guion oficial de defensa oral de 15 minutos** redactado para lograr una presentación **magistral en lo técnico, transparente en lo metodológico y desprovista de pretensiones**. Prioriza la justificación basada en ingeniería de software, la honestidad sobre los *trade-offs* elegidos y el dominio pragmático de cada recurso en la nube.

---

## ⏱️ Distribución Estratégica del Tiempo (15 Minutos Totales)

```
[00:00 - 02:00] ──► FASE 1: Introducción, Contexto de Negocio y Arquitectura General (Diapos 1-2)
[02:00 - 05:00] ──► FASE 2: Contenerización, Hardening y Orquestación Local (Diapo 3)
[05:00 - 08:30] ──► FASE 3: Topología de Red AWS y Seguridad Perimetral (Diapos 4-5)
[08:30 - 11:30] ──► FASE 4: Orquestación en Kubernetes EKS, Auto-escalado y CI/CD (Diapos 6-7)
[11:30 - 13:30] ──► FASE 5: Demostración Operativa, Métricas y Persistencia (Diapos 8-9)
[13:30 - 15:00] ──► FASE 6: Retrospectiva Crítica, Trade-offs y Cierre (Diapo 10)
```

---

## 📊 Guion Diapositiva por Diapositiva: Contenido Visual y Discurso Formal

---

### 🟢 Diapositiva 1: Portada y Contextualización del Proyecto
* **Contenido Visual en Pantalla:**
  * **Título:** Despliegue de Plataforma Multicapa con Cultura DevOps, CI/CD y Amazon EKS.
  * **Proyecto:** Evaluación Final Transversal — ISY1101 | Duoc UC.
  * **Autor:** Ignacio Salazar.
  * **Entorno Cloud:** AWS Account `571617431105` | Región `us-east-1` (N. Virginia).

> 🗣️ **Guion de Discurso (00:00 - 01:00):**  
> *"Estimados docentes y miembros de la comisión evaluadora, muy buenos días. Mi nombre es Ignacio Salazar y hoy presento la defensa de la Evaluación Final Transversal del proyecto de DevOps. El propósito central de este trabajo no fue simplemente desplegar código en la nube, sino construir un ciclo de vida completo de software caracterizado por la repetibilidad, el aislamiento de entornos, la seguridad en capas y la automatización del despliegue. Durante los próximos 15 minutos, les explicaré cómo transformamos una arquitectura monolítica en una plataforma de microservicios contenerizada, altamente disponible en Amazon EKS y totalmente automatizada desde GitHub Actions."*

---

### 🟢 Diapositiva 2: Arquitectura de la Solución y Topología General
* **Contenido Visual en Pantalla:**
  * Diagrama de Arquitectura Multicapa (Edge → Presentación → Lógica → Datos).
  * Flujo de tráfico: `Usuario (HTTP :80)` $\rightarrow$ `AWS LoadBalancer (Subred Pública)` $\rightarrow$ `Frontend Nginx Pod` $\rightarrow$ `Backend Express API Pod (:5000)` $\rightarrow$ `PostgreSQL DB Pod (:5432)`.

> 🗣️ **Guion de Discurso (01:00 - 02:00):**  
> *"La solución adopta un patrón arquitectónico de tres capas desacopladas. En el nivel de entrada, un servidor web Nginx actúa como punto de terminación y proxy inverso; en la capa intermedia, una API REST construida sobre Node.js Express procesa la lógica de negocio; y en el nivel de persistencia, un motor relacional PostgreSQL 16 almacena el estado del sistema. El valor fundamental de este diseño radica en la separación estricta de responsabilidades: ninguna capa conoce más de lo necesario para operar, y la comunicación fluye siempre de manera unidireccional y controlada mediante nombres de servicio abstractos."*

---

### 🟢 Diapositiva 3: Contenerización, Multi-Stage Build y Hardening (IE2)
* **Contenido Visual en Pantalla:**
  * Esquema comparativo: Imagen Tradicional (800 MB) vs. Imagen Multi-Stage Alpine (110 MB).
  * Fragmento de `backend/Dockerfile` destacando `FROM node:20-alpine AS build`, `npm test` y `USER node`.
  * Captura de `docker-compose ps` ejecutando localmente en la red `devops_internal_network`.

> 🗣️ **Guion de Discurso (02:00 - 05:00):**  
> *"Al abordar la contenerización, aplicamos un principio de ingeniería riguroso: reducir la superficie de ataque y el peso operativo. Para ello, implementamos Dockerfiles de compilación multietapa (Multi-Stage Builds). En la primera etapa, o 'Build Stage', compilamos el código e invocamos la suite de pruebas unitarias automatizadas con Jest. Solo si las pruebas pasan exitosamente, la segunda etapa copia los artefactos resultantes sobre una imagen ultra-ligera basada en Linux Alpine. Adicionalmente, aplicamos un hardening crítico en el contenedor del backend: mediante la directiva `USER node`, despojamos al proceso de privilegios de usuario `root`, mitigando cualquier riesgo de ejecución remota de código en el sistema de archivos del contenedor. Localmente, validamos esta topología mediante Docker Compose sobre un puente de red aislado."*

---

### 🟢 Diapositiva 4: Redes en AWS: VPC Multi-AZ y Seguridad Perimetral (IE4)
* **Contenido Visual en Pantalla:**
  * Diagrama de la VPC `devops-eks-vpc` (`10.0.0.0/16`).
  * Distribución Multi-AZ: Subredes Públicas (`10.0.1.0/24`, `10.0.2.0/24`) vs Privadas (`10.0.10.0/24`, `10.0.20.0/24`).
  * Matriz del Security Group `devops-eks-workers-sg` (`sg-0289686b9df8f66b4`).

> 🗣️ **Guion de Discurso (05:00 - 06:45):**  
> *"Al trasladar la arquitectura a Amazon Web Services, diseñamos la red virtual `devops-eks-vpc` bajo un esquema de alta disponibilidad Multi-AZ, segmentada entre las Zonas de Disponibilidad `us-east-1a` y `us-east-1b`. La red se divide en 4 subredes: dos públicas que albergan los balanceadores de carga orientados a Internet y las puertas de enlace NAT, y dos privadas donde residen en forma completamente aislada los nodos de cómputo de Kubernetes y las bases de datos. El acceso perimetral se controla mediante Security Groups de estado explícito: el puerto 80 solo acepta tráfico HTTP público hacia el frontend, mientras que los puertos 5000 (API) y 5432 (PostgreSQL) están cerrados hacia el exterior y únicamente responden al bloque CIDR privado `10.0.0.0/16`."*

---

### 🟢 Diapositiva 5: Automatización CI/CD con GitHub Actions y Amazon ECR (IE3)
* **Contenido Visual en Pantalla:**
  * Diagrama de Pipeline de 3 Etapas (`🧪 Test` $\rightarrow$ `🐳 Build & Push ECR` $\rightarrow$ `🚀 Deploy EKS`).
  * Inyección segura de secretos con `aws-actions/configure-aws-credentials`.
  * Escaneo automático de seguridad en ECR (`scanOnPush=true`).

> 🗣️ **Guion de Discurso (06:45 - 08:30):**  
> *"La automatización continua la canalizamos a través de GitHub Actions mediante un pipeline push-based de 3 fases. Ante cualquier cambio integrado en la rama `main`, la fase 1 ejecuta las pruebas unitarias en un corredor efímero. Si la calidad es validada, la fase 2 se autentica contra Amazon ECR, construye las imágenes etiquetándolas tanto con el tag `latest` como con el número de compilación `v<run_number>`, permitiendo trazabilidad y rollback instantáneo. ECR analiza la imagen en busca de vulnerabilidades CVE conocidas. Finalmente, la fase 3 utiliza credenciales cifradas en GitHub Secrets para conectarse al API Server de EKS y desencadenar un despliegue progresivo (*Rolling Update*) sin interrumpir el servicio a los usuarios."*

---

### 🟢 Diapositiva 6: Amazon EKS: Manifestos Declarativos, NetworkPolicies y HPA (IE4)
* **Contenido Visual en Pantalla:**
  * Estado del Clúster EKS `devops-eks-cluster` (Active, v1.31/v1.36, 2 nodos `t3.medium`).
  * Esquema de NetworkPolicies: Restricción de tráfico Ingress Pod-to-Pod (`app: devops-frontend` $\rightarrow$ `app: devops-backend` $\rightarrow$ `app: postgres`).
  * Configuración del HPA (`backend-hpa` al 70% CPU / `frontend-hpa` al 75% CPU).

> 🗣️ **Guion de Discurso (08:30 - 10:15):**  
> *"En el plano de orquestación, Amazon EKS mantiene el estado deseado mediante manifiestos declarativos YAML. Para llevar la seguridad a nivel micro-segmentado dentro del clúster, aplicamos `NetworkPolicies`. Esto significa que, incluso si un atacante vulnerara el contenedor del frontend, las reglas de filtro a nivel de kernel CNI le impedirían enviar paquetes directamente hacia el puerto 5432 de la base de datos, porque PostgreSQL solo acepta conexiones provenientes de pods identificados con la etiqueta `app: devops-backend`. Adicionalmente, la elasticidad del sistema queda garantizada mediante el Horizontal Pod Autoscaler (HPA), que monitorea las métricas del `metrics-server` y escala dinámicamente las réplicas del backend de 2 a 5 pods al superar el 70% de utilización de CPU."*

---

### 🟢 Diapositiva 7: Demostración Operativa en Vivo y Estrategia Zero-Downtime (IE5)
* **Contenido Visual en Pantalla:**
  * Captura del sitio web en producción a través de la DNS pública del LoadBalancer.
  * Insignia dinámica de versión `v4.0-EKS-Live`.
  * Visualización de actualización progresiva (*Rolling Update* con `maxSurge: 1`, `maxUnavailable: 0`).

> 🗣️ **Guion de Discurso (10:15 - 11:30):**  
> *"En la verificación operativa en vivo, observamos la aplicación respondiendo a través de la URL asignada por el Network Load Balancer de AWS. Para asegurar una experiencia de usuario ininterrumpida ante un nuevo despliegue, configuramos la estrategia de actualización `RollingUpdate` con un `maxSurge` de 1 pod y `maxUnavailable` de 0. Esto garantiza que Kubernetes instancie primero el pod nuevo, verifique su estado de salud mediante el `readinessProbe` en `/api/health` y, recién cuando esté listo para recibir tráfico, drene y retire el pod antiguo. El usuario final jamás experimenta un error 502 o 504 durante una actualización de versión."*

---

### 🟢 Diapositiva 8: Persistencia de Datos, Observabilidad y Métricas (IE5)
* **Contenido Visual en Pantalla:**
  * Tabla de tareas sincronizadas desde la tabla `system_tasks` en PostgreSQL.
  * Respuesta JSON del endpoint de observabilidad `/api/metrics` (Uptime, RSS, Heap memory).
  * Monitoreo de auditoría con logs centralizados en AWS CloudWatch.

> 🗣️ **Guion de Discurso (11:30 - 12:45):**  
> *"La capa de datos demuestra la correcta integración del ciclo de vida relacional. Al arrancar el microservicio, el módulo de conexión `db.js` ejecuta la inicialización de tablas e inserta registros de prueba en PostgreSQL. Para monitorear la salud interna de la aplicación, implementamos el endpoint `/api/metrics`, el cual expone en formato JSON estandarizado el tiempo de actividad (*Uptime*), las peticiones totales servidas y el consumo discriminado de memoria Heap y Resident Set Size (RSS). En el nivel de infraestructura, CloudWatch recolecta las trazas del API Server, permitiendo auditoría forense ante cualquier anomalía."*

---

### 🟢 Diapositiva 9: Matriz de Logro y Cumplimiento Metodológico
* **Contenido Visual en Pantalla (Tabla Sintética de Indicadores de Evaluación):**

| Indicador de Evaluación | Criterio Técnico Aplicado | Estado |
| :--- | :--- | :--- |
| **IE1: Control de Versiones** | Estrategia de ramas, commits atómicos, `.gitignore` estricto | 100% Cumplido |
| **IE2: Contenerización** | Multi-stage builds, `USER node`, hardening, Docker Compose | 100% Cumplido |
| **IE3: Integración Continua** | Pipeline GitHub Actions, ECR scan, tagging semántico | 100% Cumplido |
| **IE4: Infraestructura Cloud** | VPC Multi-AZ, Subredes privadas, EKS Cluster, Security Groups | 100% Cumplido |
| **IE5: Verificación & Métricas** | Healthchecks `/api/health`, endpoint `/api/metrics`, HPA, NLB | 100% Cumplido |

> 🗣️ **Guion de Discurso (12:45 - 13:30):**  
> *"Como refleja la matriz de cumplimiento, cada una de las exigencias del encargo académico fue abordada no solo como un requisito formal, sino como una oportunidad para implementar estándares reales de la industria de software. La plataforma es auditable, reproducible, segura por diseño y elástica ante demandas de carga."*

---

### 🟢 Diapositiva 10: Retrospectiva Crítica, Trade-offs y Conclusión
* **Contenido Visual en Pantalla:**
  * **Trade-off 1:** Base de datos en Pod con `emptyDir`/`PVC` (Económico/Educativo) vs. AWS RDS PostgreSQL Administrado (Producción Corporativa).
  * **Trade-off 2:** CI/CD Push-based con GitHub Actions vs. GitOps Pull-based con ArgoCD.
  * **Lecciones Aprendidas:** La importancia del orden de dependencias en infraestructura y la micro-segmentación.

> 🗣️ **Guion de Discurso (13:30 - 15:00):**  
> *"Para finalizar, me gustaría ofrecer una reflexión técnica honesta sobre las decisiones de diseño. En una solución corporativa de misión crítica, la ejecución de PostgreSQL como un pod dentro de Kubernetes presenta limitaciones de failover relacional; la mejor práctica sería delegar el estado a un servicio administrado como AWS RDS Multi-AZ. Asumimos esta decisión en el proyecto para optimizar la cuota académica manteniendo la portabilidad declarativa en Kubernetes. Asimismo, reconocemos que el estándar emergente en la industria evoluciona hacia modelos GitOps con herramientas como ArgoCD para evitar almacenar credenciales de infraestructura en los runner pipelines. 
> 
> En conclusión, este proyecto demuestra que la cultura DevOps es mucho más que herramientas: es la integración disciplinada de código, seguridad y operaciones. Quedo a la entera disposición de la comisión para responder sus preguntas. Muchas gracias."*

---

## ❓ Banco de Preguntas Críticas de la Comisión (Con Respuestas Magistrales y Pragmáticas)

### 1. ¿Por qué separaron las subredes en públicas y privadas si Kubernetes igual gestiona los pods internamente?
> 💡 **Respuesta Magistral:**  
> *"Por defensa en profundidad. Las subredes públicas existen únicamente para albergar los puntos de entrada que requieren direccionamiento IPv4 público de Internet, como el Load Balancer y el NAT Gateway. Los nodos worker de EC2 y los Pods donde corren la lógica de negocio y los datos se ubican en subredes privadas. Esto garantiza que, incluso si ocurriera un fallo en las reglas de iptables o CNI de Kubernetes, las máquinas subyacentes no tienen una IP pública ruteable desde el exterior, eliminando vectores de ataque directos."*

### 2. ¿Cómo manejan las credenciales sensibles (como claves de AWS o passwords de DB) en todo el ciclo?
> 💡 **Respuesta Magistral:**  
> *"En ningún punto del código fuente ni del repositorio existen credenciales hardcodeadas. Para el pipeline de CI/CD, las claves de acceso de AWS se almacenan como secretos cifrados en GitHub Secrets y se inyectan únicamente durante la ejecución del runner. Dentro del clúster de Kubernetes, las credenciales de la base de datos se gestionan a través de un objeto `Secret` nativo, del cual los pods leen las variables `DB_USER` y `DB_PASSWORD` mediante `valueFrom.secretKeyRef` de forma transparente y aislada."*

### 3. Si el tráfico aumenta 10 veces en 1 minuto, ¿cómo responde su sistema?
> 💡 **Respuesta Magistral:**  
> *"El sistema responde en dos niveles de elasticidad: a nivel de aplicación, el Horizontal Pod Autoscaler (HPA) detecta el incremento en la utilización de CPU/memoria a través del Metrics Server y escala rápidamente las réplicas del backend de 2 a 5 pods. Si la demanda agota la capacidad física de los nodos actuales (`t3.medium`), la configuración del Node Group de EKS permite auto-escalar la infraestructura subyacente hasta un máximo de 3 nodos EC2, garantizando la continuidad operativa sin intervención manual."*

### 4. ¿Qué ocurre si un nodo físico de EC2 en `us-east-1a` sufre una caída total en AWS?
> 💡 **Respuesta Magistral:**  
> *"Gracias a nuestra topología Multi-AZ y a tener `replicas: 2` tanto en el frontend como en el backend, Kubernetes distribuye automáticamente las réplicas entre los nodos de `us-east-1a` y `us-east-1b`. Si la Zona de Disponibilidad 1A cae completamente, el plano de control de EKS detecta que el nodo no responde (`NotReady`), desregistra sus pods endpoints del Load Balancer y rescheduling las réplicas faltantes en los nodos supervivientes de la zona 1B. El balanceador de carga redirige todo el tráfico hacia la zona sana en cuestión de segundos."*

### 5. ¿Por qué utilizaron Nginx como Reverse Proxy en el Frontend en lugar de conectar el cliente directamente al Backend?
> 💡 **Respuesta Magistral:**  
> *"Por tres razones técnicas fundamentales: primero, desacoplamiento y seguridad (Same-Origin Policy), ya que Nginx intercepta las peticiones en `/api/` y las canaliza internamente a `http://backend:5000`, evitando problemas de CORS en el navegador; segundo, eficiencia, puesto que Nginx sirve los activos estáticos HTML y JS compilados a velocidad de C de forma extremadamente ligera; y tercero, abstrae la topología de la red interna del clúster ante el cliente externo."*
