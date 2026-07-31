# 📄 Informe Técnico de Evaluación Final Transversal
## Asignatura: ISY1101 - Introducción a Herramientas DevOps (2025)

**Integrantes del Proyecto:** [Nombre de los Estudiantes]  
**Docente:** [Nombre del Docente]  
**Fecha de Entrega:** Semana 18  
**Institución:** Duoc UC - Escuela de Informática y Telecomunicaciones  

---

## 1. Método de Integración del Sistema
El sistema implementa una **arquitectura distribuida multicapa** para asegurar alta disponibilidad, desacoplamiento y escalabilidad horizontal:

* **Frontend:** Desarrollado como una Single Page Application (SPA) con arquitectura responsiva y liviana. Servido por **Nginx 1.25 Alpine**, que además actúa como **Reverse Proxy**.
* **Backend:** Microservicio REST desarrollado en **Node.js (v20) y Express**. Proporciona endpoints de salud (`/health`), observabilidad (`/metrics`) y lógica de negocio (`/tasks`).
* **Base de Datos:** Motor relacional **PostgreSQL 16 Alpine**, configurado con volúmenes persistentes y scripts de inicialización automatizados (`init.sql`).
* **Comunicación:** El Frontend no expone puertos internos del backend al navegador; todas las solicitudes iniciadas por la interfaz hacia `/api/*` son capturadas por el servidor Nginx y canalizadas internamente a través de la red privada de contenedores hacia `backend:5000`.

---

## 2. Contenerización y Orquestación Local
Para garantizar el principio *Write Once, Run Anywhere*, se aplicaron buenas prácticas en la creación de imágenes:

* **Dockerfile Multietapa (Multi-Stage Build):**
  * *Backend:* La primera etapa (`build`) instala todas las dependencias y ejecuta la suite de pruebas unitarias (`npm test`). La segunda etapa (`production`) descarga únicamente dependencias de producción en una imagen `node:20-alpine`, descartando herramientas de compilación y reduciendo el tamaño de la imagen final a menos de 90 MB.
  * *Frontend:* Se compila y empaqueta el contenido estático, copiándolo a una imagen minimalista de `nginx:1.25-alpine`.
* **Hardening de Contenedores:**
  * Uso de imágenes base basadas en **Alpine Linux** para minimizar la superficie de ataque e inmunizar contra vulnerabilidades conocidas de distribuciones pesadas.
  * Ejecución con usuario sin privilegios (`USER node`) en el backend.
  * Creación de archivos `.dockerignore` para prevenir la inclusión de credenciales, repositorios `.git` o carpetas `node_modules` locales.
* **Orquestación Local con Docker Compose:**
  * Archivo `docker-compose.yml` que define la red aislada de tipo bridge (`devops-net`).
  * Dependencias condicionales (`depends_on`) sujetas a la verificación de salud del motor de base de datos (`healthcheck` mediante `pg_isready`).

---

## 3. Registro de Imágenes y Trazabilidad (ECR / Docker Hub)
El proceso de empaquetado publica los artefactos en un registro centralizado (Amazon ECR / Docker Hub) aplicando un esquema de etiquetado dual:
* **Tag de producción (`latest`):** Apunta a la versión estable actual.
* **Tag de trazabilidad (`v<build_number>`):** Asocia cada imagen al número de ejecución único del pipeline de GitHub Actions (`github.run_number`), permitiendo realizar rollback inmediato a versiones anteriores en caso de anomalías en producción.

---

## 4. Pipeline de CI/CD (GitHub Actions)
La automatización de Integración y Entrega Continua está definida en `.github/workflows/ci-cd.yml`, dividida en 3 etapas secuenciales:

1. **Pruebas Unitarias & Calidad (Test):** Clona el repositorio, configura el entorno de Node.js y ejecuta la suite de tests en Jest con Supertest. Si las pruebas fallan, el pipeline se detiene inmediatamente impidiendo la creación de artefactos defectuosos.
2. **Construcción & Publicación (Build & Push):** Se autentica contra el Container Registry utilizando Docker Buildx y publica las imágenes de Frontend y Backend etiquetadas.
3. **Despliegue Automatizado (Deploy):** Configura las credenciales de AWS e inicia la actualización de los servicios en la nube en la rama principal.

---

## 5. Infraestructura en la Nube (AWS)
La arquitectura cloud propuesta sobre AWS sigue el Marco de Buena Arquitectura (AWS Well-Architected Framework):

* **VPC (Virtual Private Cloud):** Segmentación de red aislada con subredes públicas (para el balanceador de carga Nginx) y subredes privadas (para las instancias de aplicación y la base de datos PostgreSQL).
* **Security Groups (Grupos de Seguridad):**
  * *SG Frontend/ALB:* Permite tráfico entrante únicamente en el puerto 80 (HTTP) y 443 (HTTPS) desde la Internet (`0.0.0.0/0`).
  * *SG Backend:* Permite tráfico exclusivamente desde el SG del Frontend en el puerto 5000.
  * *SG Database:* Permite tráfico en el puerto 5432 únicamente originado desde el SG del Backend.
* **Orquestación en Producción (Amazon ECS / EKS):** Se eligió un servicio de orquestación administrado como **Amazon ECS (Elastic Container Service)** con motor Fargate. Esto elimina la necesidad de gestionar servidores subyacentes, proporcionando auto-escalado horizontal automático, auto-recuperación de contenedores caídos y alta disponibilidad multizona.

---

## 6. Configuración, Secretos y Seguridad (Mínimo Privilegio)
* **Gestión de Secretos:** Ninguna contraseña, token o clave de base de datos se encuentra codificada en duro en el código fuente. Se utilizan variables de entorno inyectadas mediante **GitHub Secrets** en el pipeline y **AWS Secrets Manager** / **Systems Manager Parameter Store** en producción.
* **Mínimo Privilegio (IAM):** El pipeline de CI/CD se autentica en AWS mediante un rol de IAM dedicado con permisos estrictos limitados a subir imágenes en ECR y actualizar tareas en ECS.

---

## 7. Observabilidad y Monitoreo
* **Logs del Pipeline:** Trazabilidad completa en GitHub Actions de cada paso de compilación y prueba.
* **Logs y Métricas CloudWatch:**
  * El endpoint `/api/metrics` expone métricas en tiempo real de uso de CPU, Uptime y memoria Heap.
  * Logs centralizados en **AWS CloudWatch Logs** mediante el controlador de registros `awslogs` en las definiciones de tareas de ECS.
  * Alarmas de CloudWatch configuradas para notificar picos de CPU mayores al 80% o errores 5xx sostenidos.

---

## 8. Conclusiones y Defensa Técnica
La solución desarrollada cumple con los estándares exigidos para entornos de grado de producción: automatización total desde el commit inicial hasta el despliegue en la nube, seguridad multinivel, imágenes ligeras y monitoreo transparente.
