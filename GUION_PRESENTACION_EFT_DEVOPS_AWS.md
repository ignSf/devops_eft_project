# 📊 GUION MAESTRO Y DIAPOSITIVAS: PRESENTACIÓN DEVOPS AWS EKS (EFT)

Este artefacto contiene la **estructura visual de diapositivas** y el **Speech (guion verbal exacto)** para cada diapositiva de tu defensa oral del proyecto **Plataforma DevOps Cloud-Native ISY1101 (Duoc UC 2026)**.

---

## 📽️ DIAPOSITIVA 1: Carátula e Introducción
* **Título visual:** Plataforma DevOps Cloud-Native sobre Amazon EKS & CI/CD
* **Subtítulo:** Evaluación Final Transversal (EFT) | ISY1101 - Duoc UC
* **Contenido visual:** Logotipos de AWS, Kubernetes, Docker, GitHub Actions y Duoc UC. Nombres de los integrantes.

### 🎙️ Speech para decir verbalmente:
> *"Estimados profesores y miembros de la comisión evaluadora, muy buenos días/tardes. Hoy presentamos nuestra **Plataforma DevOps Cloud-Native**, una solución integral diseñada para modernizar el ciclo de vida de desarrollo, containerización, infraestructura como código y despliegue automatizado sobre la nube de Amazon Web Services usando **Amazon EKS**. A continuación, les mostraremos cómo transformamos un sistema monolítico tradicional en una arquitectura altamente disponible, segura y autoescalable."*

---

## 📽️ DIAPOSITIVA 2: Problemática y Objetivos del Proyecto
* **Título visual:** Desafío DevOps & Objetivos Estratégicos
* **Contenido visual:**
  * **Problema:** Despliegues manuales, falta de trazabilidad, caídas de servicio durante actualizaciones y claves hardcodeadas.
  * **Objetivo General:** Implementar una canalización CI/CD automatizada sobre Kubernetes (EKS) aplicando las mejores prácticas de seguridad Shift-Left y arquitectura VPC Multi-AZ.

### 🎙️ Speech para decir verbalmente:
> *"El objetivo central de este proyecto fue resolver las ineficiencias clásicas del desarrollo tradicional: despliegues manuales propensos a errores humanos, falta de pruebas automatizadas y vulnerabilidades de seguridad por credenciales expuestas.*
>
> *Para solucionar esto, establecimos tres pilares: **1) Containerización inmutable** con Docker; **2) Automatización CI/CD continua** con GitHub Actions; y **3) Orquestación de nivel empresarial** sobre Amazon EKS garantizando alta disponibilidad y cero tiempo de inactividad."*

---

## 📽️ DIAPOSITIVA 3: Arquitectura de Red Cloud en AWS VPC
* **Título visual:** Diseño de Red Cloud-Native (AWS VPC Multi-AZ)
* **Contenido visual:** Diagrama de arquitectura VPC (`10.0.0.0/16`):
  * **2 Subredes Públicas:** Con Internet Gateway, NAT Gateway e IP pública habilitada.
  * **2 Subredes Privadas:** Albergando los Nodos Worker EC2 y comunicadas por la NAT Gateway.
  * **Security Groups:** `SG-TEST-EKS-CLUSTER` y `devops-eks-workers-sg`.

### 🎙️ Speech para decir verbalmente:
> *"Nuestra infraestructura en la nube fue construida desde cero bajo el **principio de menor privilegio a nivel de red**. Diseñamos una Amazon VPC aislada con dos zonas de disponibilidad.*
>
> *Las subredes públicas albergan el Internet Gateway y la NAT Gateway únicamente para recibir tráfico de usuarios y permitir que las subredes privadas salgan a buscar parches de forma segura. Los nodos worker de cómputo residen exclusivamente en las **subredes privadas**, quedando totalmente invisibles y protegidos ante ataques directos desde Internet."*

---

## 📽️ DIAPOSITIVA 4: Estrategia de Contenedores y Multi-Stage Builds
* **Título visual:** Containerización Eficiente con Docker
* **Contenido visual:**
  * Comparativa de imágenes: Imagen estándar Node.js (1 GB) vs Imagen Multi-Stage Alpine (50 MB).
  * Diagrama de construcción: `Stage 1: Build & Test` $\rightarrow$ `Stage 2: Runtime Minimal`.
  * Seguridad: Uso de usuario no-root (`USER node`) e instrucción `HEALTHCHECK`.

### 🎙️ Speech para decir verbalmente:
> *"Para el empaquetado de las aplicaciones, aplicamos la técnica de **Multi-Stage Builds** en los Dockerfiles de Frontend y Backend. Esto nos permitió separar la etapa pesada de compilación de la etapa final de ejecución.*
>
> *Utilizamos imágenes base ultra-livianas de **Linux Alpine**, logrando reducir el peso de nuestras imágenes de más de 1 Gigabyte a solo **50 Megabytes**. Esto no solo acelera la velocidad de descarga en el clúster, sino que elimina el 90% de las librerías innecesarias, reduciendo drásticamente la superficie de vulnerabilidad."*

---

## 📽️ DIAPOSITIVA 5: Orquestación en Nube con Amazon EKS
* **Título visual:** Plano de Control y Nodos Administrados EC2
* **Contenido visual:**
  * **Cluster EKS:** `CLUSTER-EKS-TEST-REAL` (Control Plane en alta disponibilidad).
  * **Managed Node Group:** 2 Instancias EC2 `t3.medium` en subredes privadas.
  * **Autenticación:** IAM Role `LabRole` y mapeo `aws-auth` con API de EKS.

### 🎙️ Speech para decir verbalmente:
> *"En la capa de orquestación utilizamos **Amazon EKS (Elastic Kubernetes Service)**. En lugar de depender de configuraciones automáticas opacas, aprovisionamos un **Managed Node Group administrado por EC2** compuesto por dos instancias `t3.medium` distribuídas en distintas zonas de disponibilidad.*
>
> *Esto nos garantiza que si una zona geográfica de AWS sufriera una interrupción, el plano de control migra automáticamente las cargas de trabajo a la segunda máquina sin interrumpir el servicio."*

---

## 📽️ DIAPOSITIVA 6: Registro y Seguridad de Artefactos (Amazon ECR)
* **Título visual:** Repositorios Privados Amazon ECR
* **Contenido visual:** Captura o diagrama de ECR:
  * Repositorios: `test-devops-backend-ecr` y `test-devops-frontend-ecr`.
  * Cifrado en reposo (AES-256) e inmutabilidad de tags (`latest` y `:v${BUILD_NUMBER}`).

### 🎙️ Speech para decir verbalmente:
> *"Las imágenes de contenedores compiladas son almacenadas en **Amazon ECR (Elastic Container Registry)** con cifrado bancario AES-256. Cada imagen publicada por el pipeline recibe un etiquetado semántico único vinculado al número de compilación de GitHub Actions.*
>
> *Esto garantiza trazabilidad auditable: sabemos exactamente qué commit generó qué contenedor y nos permite realizar un rollback instantáneo a cualquier versión anterior si fuera necesario."*

---

## 📽️ DIAPOSITIVA 7: Pipeline de CI/CD Automatizado (GitHub Actions)
* **Título visual:** Automatización Continua de Extremo a Extremo
* **Contenido visual:** Diagrama de las 3 fases del pipeline (`ci-cd.yml`):
  $$\text{1. Pruebas Unitarias (Jest)} \longrightarrow \text{2. Build \& Push (ECR)} \longrightarrow \text{3. Deploy (EKS Rollout)}$$

### 🎙️ Speech para decir verbalmente:
> *"Nuestra automatización CI/CD está gobernada por **GitHub Actions**. El pipeline implementa el principio de **Fail-Fast** dividido en 3 etapas:*
>
> *Primero, se ejecutan las pruebas unitarias con Jest. Si una sola prueba falla, el pipeline se aborta de inmediato. Segundo, si las pruebas aprueban, se compilan y suben las imágenes a Amazon ECR. Y tercero, mediante la CLI de AWS y `kubectl`, se inyectan dinámicamente las variables de entorno y se aplican los cambios en Amazon EKS con cero tiempo de caída."*

---

## 📽️ DIAPOSITIVA 8: Manifiestos K8s e Inyección Dinámica
* **Título visual:** Infraestructura como Código Declarativa (`k8s/`)
* **Contenido visual:** Estructura de manifiestos:
  * `secrets.yaml` (`db-credentials`).
  * `database-deployment.yaml` (PostgreSQL 16).
  * `backend-deployment.yaml` & `frontend-deployment.yaml`.
  * Inyección dinámica con `sed` desde GitHub Secrets.

### 🎙️ Speech para decir verbalmente:
> *"Toda la topología de la aplicación está codificada en manifiestos declarativos de Kubernetes. Destacamos el uso de objetos **Secret (`db-credentials`)** que aíslan las credenciales de la base de datos PostgreSQL.*
>
> *Además, mediante comandos `sed` integrados en el pipeline, inyectamos dinámicamente los repositorios desde **GitHub Secrets**, evitando cualquier tipo de hardcodeo en el código fuente y cumpliendo con los estándares Twelve-Factor App."*

---

## 📽️ DIAPOSITIVA 9: Alta Disponibilidad, HPA y Zero-Trust NetworkPolicies
* **Título visual:** Escalabilidad Inteligente y Seguridad Zero-Trust
* **Contenido visual:**
  * **HPA (Horizontal Pod Autoscaler):** Umbral del 50% CPU $\rightarrow$ Escala de 2 a 5 Pods.
  * **NetworkPolicies:** Diagrama de aislamiento (Frontend $\rightarrow$ Backend $\rightarrow$ PostgreSQL).

### 🎙️ Speech para decir verbalmente:
> *"Para garantizar resiliencia operative, implementamos **Horizontal Pod Autoscaling (HPA)**. El clúster monitorea en tiempo real el consumo de CPU y, si la demanda supera el 50%, escala automáticamente los pods de 2 a 5 réplicas.*
>
> *Complementariamente, aplicamos **NetworkPolicies a nivel de pod**: la base de datos solo escucha conexiones del backend en el puerto 5432, y el backend solo escucha al frontend en el puerto 5000. Si un atacante lograra vulnerar el servidor web, le sería matemáticamente imposible acceder a la base de datos por la red interna."*

---

## 📽️ DIAPOSITIVA 10: Demostración en Vivo (Live Demo)
* **Título visual:** Verificación Operativa del Sistema en Nube
* **Contenido visual:**
  * URL pública del Load Balancer: `http://a12f9...elb.amazonaws.com`
  * Captura o terminal en vivo con `kubectl get nodes`, `kubectl get pods` y el estado **GREEN (ONLINE)**.

### 🎙️ Speech para decir verbalmente:
> *"A continuación, pasamos a la **demostración en vivo**. Como pueden observar en pantalla, la aplicación web está publicada y accesible a través del Elastic Load Balancer público aprovisionado por AWS.*
>
> *En la terminal podemos verificar que los 2 nodos EC2 están `Ready`, los 3 microservicios están en estado `Running` y la base de datos PostgreSQL está respondiendo correctamente con el indicador en verde."*

---

## 📽️ DIAPOSITIVA 11: Conclusiones y Lecciones Aprendidas
* **Título visual:** Logros del Proyecto & Valor DevOps
* **Contenido visual:**
  * ✅ Tiempo de despliegue reducido de horas a 2 minutos.
  * ✅ Cobertura completa de seguridad (VPC aislada + Secrets + NetworkPolicies).
  * ✅ Cero downtime en actualizaciones gracias a Kubernetes Rolling Updates.

### 🎙️ Speech para decir verbalmente:
> *"En conclusión, este proyecto demostró el valor transformador de la metodología DevOps y las tecnologías cloud-native.*
>
> *Logramos reducir el tiempo de despliegue de horas de trabajo manual a solo **2 minutos automatizados**, con trazabilidad total, cero caídas durante actualizaciones y una postura de seguridad robusta de extremo a extremo. Quedamos a su entera disposición para responder sus preguntas. Muchas gracias."*

---

🏆 **¡Con este guion tienes una presentación impecable de nivel profesional!** 🚀
