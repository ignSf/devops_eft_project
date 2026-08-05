# 📄 Informe Técnico de Evaluación Final Transversal
## Asignatura: ISY1101 - Introducción a Herramientas DevOps (Duoc UC 2025)

**Integrante del Proyecto:** Ignacio Salazar  
**Docente:** Rafael Vidal  
**Fecha de Entrega:** Semana 18  
**Institución:** Duoc UC - Escuela de Informática y Telecomunicaciones  
**Cuenta AWS ID:** `571617431105` (`ign.salazarf@duocuc.cl`)

---

## 1. Método de Integración del Sistema
El sistema implementa una **arquitectura distribuida multicapa** para asegurar alta disponibilidad, desacoplamiento y escalabilidad horizontal:

* **Frontend Web:** Desarrollado como una Single Page Application (SPA) con arquitectura responsiva y liviana. Servido por **Nginx 1.25 Alpine**, que actúa además como **Reverse Proxy**.
* **Backend REST API:** Microservicio en **Node.js (v20) y Express**. Proporciona endpoints de salud (`/api/health`), observabilidad (`/api/metrics`) y lógica de negocio (`/api/tasks`).
* **Base de Datos Relacional:** Motor **PostgreSQL 16 Alpine**, configurado con volúmenes persistentes (`PersistentVolumeClaim` de 5Gi) y scripts de inicialización automatizados (`init.sql`).
* **Comunicación Interna:** El Frontend no expone puertos internos del backend al cliente; todas las solicitudes hacia `/api/*` son capturadas por Nginx y canalizadas internamente a través del Service ClusterIP hacia `backend:5000`.

---

## 2. Contenerización y Orquestación Local
Para garantizar el principio *Write Once, Run Anywhere*, se aplicaron las mejores prácticas de contenerización:

* **Dockerfile Multietapa (Multi-Stage Builds):**
  * *Backend:* Etapa 1 instala dependencias y ejecuta la suite de pruebas unitarias (`npm test`). Etapa 2 descarga únicamente dependencias de producción en `node:20-alpine`, reduciendo el tamaño a menos de 90 MB.
  * *Frontend:* Compila el código estático y lo sirve en `nginx:1.25-alpine`.
* **Hardening de Contenedores:**
  * Uso de Alpine Linux para minimizar la superficie de ataque.
  * Ejecución con usuario sin privilegios (`USER node`).
  * Inclusión de `.dockerignore` para prevenir fugas de secretos o archivos locales.
* **Orquestación Local (Docker Compose):**
  * Definición de red aislada `devops-net` y volumen `postgres_data`.
  * Verificación de salud condicional (`healthcheck` vía `pg_isready`).

---

## 3. Registro de Imágenes y Trazabilidad (Amazon ECR / Docker Hub)
El proceso de empaquetado publica los artefactos en registros centralizados (Amazon ECR `571617431105.dkr.ecr.us-east-1.amazonaws.com` / Docker Hub) aplicando etiquetado dual:
* **Tag de producción (`latest`):** Versión estable actual.
* **Tag de trazabilidad (`v<github.run_number>`):** Asocia cada imagen al número de ejecución único del pipeline de CI/CD para permitir rollback inmediato.

---

## 4. Pipeline de CI/CD (GitHub Actions)
La automatización está definida en `.github/workflows/ci-cd.yml` en 3 etapas secuenciales:

1. **Pruebas Unitarias & Calidad (Test):** Ejecuta Jest con Supertest (4/4 pruebas aprobadas). Si falla, detiene el pipeline.
2. **Construcción & Publicación (Build & Push):** Autenticación mediante Docker Buildx y push de imágenes con tags duales.
3. **Despliegue Automatizado en EKS (Deploy):** Configura credenciales AWS IAM, ejecuta `aws eks update-kubeconfig` y actualiza los deployments en Amazon EKS mediante `kubectl set image` con verificación `rollout status`.

---

## 5. Infraestructura Cloud en AWS (VPC, Subredes, Security Groups y EKS)
La infraestructura en AWS fue aprovisionada siguiendo el *AWS Well-Architected Framework*:

* **VPC (Virtual Private Cloud):** Red aislada `10.0.0.0/16` (`devops-eks-vpc`) con DNS hostnames habilitados.
* **Subredes Multi-AZ (4 Subnets):**
  * 2 Subredes Públicas (`10.0.1.0/24` us-east-1a, `10.0.2.0/24` us-east-1b) asociadas a Internet Gateway (`devops-igw`) y etiquetadas con `kubernetes.io/role/elb = 1`.
  * 2 Subredes Privadas (`10.0.10.0/24` us-east-1a, `10.0.20.0/24` us-east-1b) asociadas a NAT Gateway (`devops-nat-gw`) para salida segura a internet.
* **Grupos de Seguridad (Security Groups):**
  * `devops-eks-cluster-sg`: Permite puerto 443 HTTPS desde los trabajadores al Control Plane.
  * `devops-eks-workers-sg`: Permite puerto 80 (HTTP pública), 443 (HTTPS), 5000 (API interna), 5432 (PostgreSQL interna VPC), 1025-65535 (Kubelet) y 22 (SSH).
* **Orquestación Cloud en Amazon EKS (`devops-eks-cluster`):**
  * Node Group de 2 instancias EC2 `t3.medium` con Auto Scaling.
  * **Segmentación de Red Kubernetes (`NetworkPolicies`):** Reglas de mínimo privilegio a nivel de pods (DB solo acepta tráfico del Backend en 5432; Backend solo del Frontend en 5000).
  * **Escalabilidad Horizontal (`HorizontalPodAutoscaler` - HPA):** Auto-escalado automático del Backend (2 a 5 pods al 70% CPU) y Frontend (2 a 4 pods al 75% CPU).

---

## 6. Configuración, Secretos y Seguridad (Mínimo Privilegio)
* **Gestión de Secretos:** Uso de Kubernetes Secrets (`db-credentials`) inyectados dinámicamente como variables de entorno (`POSTGRES_USER`, `POSTGRES_PASSWORD`).
* **Seguridad en CI/CD:** Autenticación con roles IAM de mínimo privilegio y secretos cifrados en GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`).

---

## 7. Observabilidad y Monitoreo
* **Metrics Endpoint (`/api/metrics`):** Expone Uptime en segundos, memoria RSS, heapUsed y consumo CPU.
* **Health Check (`/api/health`):** Valida la conectividad a la base de datos PostgreSQL mediante `SELECT NOW()`.
* **Logs Centralizados:** Trazabilidad en tiempo real con `kubectl logs` y seguimiento de despliegues.

---

## 8. Conclusiones y Defensa Técnica
La solución desplegada en AWS cumple rigurosamente con los 6 indicadores de evaluación (IE1-IE6): automatización CI/CD de extremo a extremo, contenedores optimizados e inmunes, infraestructura de red aislada Multi-AZ, clúster Amazon EKS con auto-escalado horizontal y observabilidad pública en vivo.
