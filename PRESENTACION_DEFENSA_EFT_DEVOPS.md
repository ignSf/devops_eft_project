# 🎤 Guía de Presentación y Guion de Defensa Oral para la EFT (ISY1101)
## 🚀 Plataforma DevOps Cloud: Automatización CI/CD, Contenerización y Orquestación en AWS EKS

Este documento contiene la **estructura diapositiva por diapositiva (Diapo 1 a 10)** y el **guion de discurso (speech) de 15 minutos** redactado en primera persona para defender exitosamente la Evaluación Final Transversal ante la comisión evaluadora.

---

## ⏱️ Estructura del Tiempo (15 Minutos Totales)
* **Diapositivas 1-3 (00:00 - 04:00):** Introducción, Arquitectura y Contenerización.
* **Diapositivas 4-6 (04:00 - 09:00):** Redes AWS (VPC/Security Groups), EKS y Pipeline CI/CD.
* **Diapositivas 7-9 (09:00 - 13:00):** Demostración en Vivo (Frontend/Backend/DB) y Observabilidad.
* **Diapositiva 10 (13:00 - 15:00):** Conclusión, Retrospectiva y Preguntas del Jurado.

---

## 📊 Diapositiva por Diapositiva con Discurso Técnico

---

### 🟢 Diapositiva 1: Portada y Presentación del Proyecto
* **Título:** Arquitectura DevOps de Alta Disponibilidad y CI/CD en AWS EKS.
* **Subtítulo:** Evaluación Final Transversal | Duoc UC 2026.
* **Presentador:** Ignacio Salazar.
* **Infraestructura:** AWS Account `571617431105` | Región `us-east-1`.

> 🗣️ **Guion de Discurso (00:00 - 01:00):**  
> *"Estimados profesores y miembros de la comisión, muy buenos días. Mi nombre es Ignacio Salazar y hoy les presento la defensa de la Evaluación Final Transversal del módulo de DevOps. El objetivo de este proyecto fue diseñar, implementar y desplegar una plataforma multicapa completa de microservicios, utilizando las mejores prácticas de Infraestructura como Código, contenerización con Docker, orquestación en la nube con Amazon EKS y un pipeline automatizado de integración y despliegue continuo en GitHub Actions."*

---

### 🟢 Diapositiva 2: Arquitectura de la Solución (Multicapa Cloud)
* **Elementos a mostrar:**
  * Diagrama de Arquitectura: Usuarios -> LoadBalancer AWS -> Frontend Nginx -> Backend Express API -> Base de Datos PostgreSQL.
  * Separación de redes: Subredes Públicas (Ingress/NAT) vs Subredes Privadas (Worker Nodes & DB).

> 🗣️ **Guion de Discurso (01:00 - 02:30):**  
> *"La solución arquitectónica se compone de 3 capas claramente delimitadas: en la capa de presentación tenemos un Frontend Web construido en Nginx; en la capa de lógica de negocio, un microservicio REST API desarrollado en Node.js Express; y en la capa de datos, un motor relacional PostgreSQL 16. Todo el tráfico externo ingresa de manera segura a través de un LoadBalancer de AWS en subredes públicas, mientras que la lógica de aplicación y los datos residen en subredes privadas dentro de nuestra VPC aislada."*

---

### 🟢 Diapositiva 3: Contenerización y Hardening con Docker (IE2)
* **Elementos a mostrar:**
  * Captura de `docker-compose ps` (Evidencia #15).
  * Dockerfile Multi-Stage del Backend (`node:20-alpine`, `USER node`).
  * Dockerfile Multi-Stage del Frontend (`nginx:1.25-alpine`).

> 🗣️ **Guion de Discurso (02:30 - 04:00):**  
> *"Para garantizar la portabilidad y la eficiencia, implementar contenerización mediante Dockerfiles multietapa. En el backend, utilizamos `node:20-alpine` como imagen base, ejecutando la suite de pruebas unitarias durante el build stage y aplicando hardening de seguridad corriendo la aplicación con el usuario no privilegiado `USER node`. En el frontend, optimizamos Nginx para actuar como Reverse Proxy directo hacia el backend. Localmente, orquestamos todo con Docker Compose en la red aislada `devops_internal_network`."*

---

### 🟢 Diapositiva 4: Infraestructura Cloud en AWS (VPC, Subredes y Security Groups) (IE4)
* **Elementos a mostrar:**
  * Captura del VPC Resource Map (Evidencia #08).
  * Captura del Security Group `devops-eks-workers-sg` (`sg-0289686b9df8f66b4`) (Evidencia #05).
  * Rango CIDR: `172.31.0.0/16` en 2 Zonas de Disponibilidad (Multi-AZ).

> 🗣️ **Guion de Discurso (04:00 - 06:00):**  
> *"En la nube de AWS, desplegamos la VPC `devops-eks-vpc` configurada con redundancia Multi-AZ. Contamos con 4 subredes: 2 públicas orientadas a Internet y 2 privadas donde residen nuestros cómputos. La seguridad está blindada mediante Security Groups con reglas estrictas de entrada: puerto 80 para tráfico web, puerto 5000 para API REST, puerto 5432 para PostgreSQL y comunicación interna segura en la red del clúster."*

---

### 🟢 Diapositiva 5: Pipeline de CI/CD Automático en GitHub Actions (IE3)
* **Elementos a mostrar:**
  * Captura del Workflow en GitHub Actions (Evidencia #13).
  * Captura de los GitHub Secrets (Evidencia #14).
  * Flujo de las 3 etapas: `🧪 Test` -> `🐳 Build & Push ECR` -> `🚀 Deploy EKS Rollout`.

> 🗣️ **Guion de Discurso (06:00 - 08:00):**  
> *"El corazón de la automatización es nuestro pipeline en GitHub Actions. Con cada commit enviado a la rama `main`, el pipeline ejecuta 3 trabajos secuenciales: primero, ejecuta las pruebas unitarias automatizadas con Jest pasando exitosamente las 4 pruebas; segundo, compila las imágenes Docker, las etiqueta con la versión del build y las publica en Amazon ECR; y tercero, se autentica de forma segura con AWS mediante credenciales temporales y ejecuta un `kubectl rollout restart` automático en Amazon EKS sin tiempos de caída."*

---

### 🟢 Diapositiva 6: Amazon EKS y Kubernetes Deployment Manifests (IE4)
* **Elementos a mostrar:**
  * Captura del Clúster EKS en estado **ACTIVE** (Evidencia #10).
  * Captura de la terminal con `kubectl get pods,svc,hpa` (Evidencia #04).
  * Uso de `emptyDir` para persistencia temporal y `LoadBalancer` Service.

> 🗣️ **Guion de Discurso (08:00 - 09:30):**  
> *"El entorno de producción se orquesta sobre Amazon EKS con Kubernetes v1.36. Los manifiestos YAML definen Deployments con políticas de reinicio automático, la base de datos PostgreSQL expone un servicio `ClusterIP` interno y el Frontend expone un servicio de tipo `LoadBalancer` asignado con una URL pública DNS de AWS."*

---

### 🟢 Diapositiva 7: Demostración del Frontend y Notificación de Despliegue en Vivo (IE5)
* **Elementos a mostrar:**
  * Captura del Dashboard en vivo con la insignia `v4.0 Neon Glowing EKS` (Evidencia #01).
  * Indicador de salud "Sistema 100% Funcional" y entorno "Production".

> 🗣️ **Guion de Discurso (09:30 - 11:00):**  
> *"Como pueden observar en pantalla, la aplicación se encuentra publicada y funcionando en vivo. En el encabezado apreciamos el badge dinámico de versión y la animación Neón Shimmer, lo que nos permite auditar visualmente que ante cada cambio subido a Git, los nuevos pods toman el relevo de forma inmediata."*

---

### 🟢 Diapositiva 8: Persistencia en PostgreSQL y Endpoint de Métricas (IE5)
* **Elementos a mostrar:**
  * Captura de la tabla de tareas de infraestructura leídas de PostgreSQL (Evidencia #03).
  * Captura del Endpoint `/api/metrics` (Evidencia #02) respondiendo datos de Uptime y Memoria Heap.

> 🗣️ **Guion de Discurso (11:00 - 12:30):**  
> *"La integración con la base de datos es 100% funcional: al iniciar el servicio, el backend auto-inicializa las tablas en PostgreSQL y sincroniza las tareas de infraestructura. Adicionalmente, implementamos el endpoint `/api/metrics` para observabilidad en tiempo real, exponiendo métricas de Uptime y consumo de memoria RSS y Heap."*

---

### 🟢 Diapositiva 9: Resumen de Matriz de Logro y Cumplimiento de Rúbrica
* **Tabla Resumen:**
  * **IE1 (Git):** Branching strategy, commits atómicos y documentación. (100%)
  * **IE2 (Docker):** Multi-stage builds, hardening y docker-compose. (100%)
  * **IE3 (CI/CD & ECR):** GitHub Actions, Secrets y trazabilidad de tags. (100%)
  * **IE4 (AWS Cloud & EKS):** VPC Multi-AZ, SG, EKS Active y LoadBalancer. (100%)
  * **IE5 (Verificación & Métricas):** Healthcheck, metrics y persistencia. (100%)

> 🗣️ **Guion de Discurso (12:30 - 14:00):**  
> *"En resumen, se han cumplido a cabalidad los 5 indicadores de evaluación de la asignatura, construyendo un entorno real, seguro, automatizado y auditable en la nube de Amazon Web Services."*

---

### 🟢 Diapositiva 10: Conclusiones y Preguntas de la Comisión
* **Puntos Clave:**
  * Despliegue Zero-Downtime mediante Kubernetes Rolling Updates.
  * Seguridad perimetral con IAM Roles y Security Groups.
  * Código e infraestructura respaldados en GitHub.

> 🗣️ **Guion de Discurso (14:00 - 15:00):**  
> *"Este proyecto consolida los principios de la filosofía DevOps: automatización, colaboración, seguridad e infraestructura como código. Quedo a su entera disposición para responder las preguntas de la comisión evaluadora. Muchas gracias."*

---

## ❓ Preguntas Frecuentes del Jurado (Y cómo responderlas)

1. **¿Por qué usaron subredes públicas y privadas en la VPC?**
   * *Respuesta:* Para aplicar el principio de menor privilegio e aislamiento de red. El tráfico de Internet solo llega al LoadBalancer en subredes públicas; los contenedores de aplicación y datos están protegidos en subredes privadas sin exposición directa.
2. **¿Cómo garantizan que el despliegue no tenga tiempo de caída (Zero Downtime)?**
   * *Respuesta:* Utilizamos la estrategia de `rollout restart` de Kubernetes. Kubernetes levanta primero los Pods nuevos con la imagen actualizada, espera a que aprueben el `healthcheck` y luego destruye progresivamente los Pods antiguos.
3. **¿Cómo gestionaron las credenciales de AWS en el pipeline sin exponerlas?**
   * *Respuesta:* Se almacenaron como variables cifradas en **GitHub Secrets** y se inyectaron de forma dinámica en la etapa de `configure-aws-credentials` del workflow.
