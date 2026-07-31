# 🚀 Proyecto DevOps EFT - Plataforma Multicapa CI/CD y Nube (ISY1101)

Este repositorio contiene la solución práctica completa para la **Evaluación Final Transversal (EFT)** de la asignatura **ISY1101 - Introducción a Herramientas DevOps** (Duoc UC 2025).

La solución consiste en la contenerización, automatización de integración y entrega continua (CI/CD) y despliegue en la nube (AWS) de una aplicación distribuida compuesta por un **Frontend**, un **Backend REST API** y una **Base de Datos Relacional PostgreSQL**.

---

## 🏛️ Arquitectura del Sistema

```
                        +----------------------------------------+
                        |           Usuario / Cliente            |
                        +-------------------+--------------------+
                                            |
                                       Port | 80 (HTTP)
                                            v
                        +----------------------------------------+
                        |      Frontend (Nginx + HTML/JS)        |
                        +-------------------+--------------------+
                                            |
                                            | Reverse Proxy /api/
                                            v
                        +----------------------------------------+
                        |      Backend (Node.js Express API)     |
                        +-------------------+--------------------+
                                            |
                                       Port | 5432 (TCP)
                                            v
                        +----------------------------------------+
                        |     Database (PostgreSQL 16 Alpine)    |
                        +----------------------------------------+
```

---

## 📁 Estructura del Repositorio

```
devops_eft_project/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # Pipeline automatizado de CI/CD (GitHub Actions)
├── backend/
│   ├── src/
│   │   ├── app.js                # Definición de Express API y Endpoints
│   │   ├── db.js                 # Pool de conexión a PostgreSQL
│   │   └── server.js             # Punto de entrada del servidor backend
│   ├── tests/
│   │   └── app.test.js           # Pruebas unitarias aisladas con Jest & Supertest
│   ├── .dockerignore             # Exclusiones para la construcción Docker
│   ├── Dockerfile                # Imagen multietapa optimizada (node:20-alpine)
│   └── package.json              # Dependencias y scripts de test/ejecución
├── database/
│   └── init.sql                  # Script de creación de tablas y datos semilla
├── frontend/
│   ├── public/
│   │   └── index.html            # Dashboard UI de observabilidad y tareas
│   ├── .dockerignore             # Exclusiones para el frontend
│   ├── Dockerfile                # Imagen multietapa con Nginx Alpine
│   └── nginx.conf                # Configuración Nginx con reverse proxy /api/
├── docker-compose.yml            # Orquestación de desarrollo local multicapa
├── INFORME_TECNICO_DEVOPS.md     # Informe técnico completo del proyecto
└── README.md                     # Documentación principal del proyecto
```

---

## ⚙️ Instrucciones de Ejecución Local

### Prerrequisitos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
* [Docker Compose](https://docs.docker.com/compose/) v2+.

### Pasos para Levantar el Entorno Local
1. Clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITO_GITHUB>
   cd devops_eft_project
   ```

2. Levantar la pila de contenedores con Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

3. Verificar que los 3 servicios estén arriba y saludables:
   ```bash
   docker-compose ps
   ```

4. Acceder a las URLs del sistema:
   * **Frontend Dashboard UI:** [http://localhost](http://localhost)
   * **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
   * **Backend Metrics:** [http://localhost:5000/api/metrics](http://localhost:5000/api/metrics)
   * **Backend Tasks API:** [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)

---

## 🧪 Pruebas Unitarias

Para ejecutar las pruebas unitarias aisladas en el Backend:

```bash
cd backend
npm install
npm test
```

Las pruebas validan:
- Estado del endpoint `/api/health` con simulación de BD.
- Métricas de observabilidad `/api/metrics`.
- Operación de consulta y creación de tareas `/api/tasks`.

---

## 🔄 Pipeline CI/CD (GitHub Actions)

El workflow `.github/workflows/ci-cd.yml` automatiza 3 etapas principales en cada evento de `push` o `pull_request`:

1. **🧪 Stage 1: Integration & Unit Testing:** Ejecuta las pruebas unitarias con Jest sobre Node.js 20.
2. **🐳 Stage 2: Build & Push de Contenedores:** Construye las imágenes optimizadas de Frontend y Backend y las publica en Docker Hub / Amazon ECR con etiquetado semántico de versión (`latest` y `v<build_number>`).
3. **🚀 Stage 3: Deploy Automatizado en AWS:** Se conecta de forma segura mediante **AWS IAM Roles / Credentials** e impulsa la actualización en **AWS ECS / EKS**.

---

## 🔐 Gestión de Secretos requeridos en GitHub:
Para la ejecución completa en producción, configurar los siguientes **GitHub Secrets**:
* `DOCKER_HUB_USERNAME`: Usuario de Docker Hub o ECR.
* `DOCKER_HUB_TOKEN`: Access token de Docker Hub.
* `AWS_ACCESS_KEY_ID`: Credencial de acceso AWS.
* `AWS_SECRET_ACCESS_KEY`: Clave secreta AWS.
* `AWS_REGION`: Región de AWS (ej. `us-east-1`).
