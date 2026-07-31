# 🚀 Resumen de Construcción del Proyecto DevOps (ISY1101)

Este documento contiene la síntesis del proyecto creado para la **Evaluación Final Transversal de DevOps (ISY1101)**.

---

## 📁 Estructura del Proyecto Creado

```
devops_eft_project/
├── .github/workflows/
│   └── ci-cd.yml             # Pipeline automatizado de CI/CD (GitHub Actions)
├── backend/                  # Microservicio REST API (Node.js + Express)
│   ├── src/
│   │   ├── app.js            # Endpoints: /api/health, /api/metrics, /api/tasks
│   │   ├── db.js             # Conexión relacional con PostgreSQL
│   │   └── server.js         # Punto de entrada
│   ├── tests/
│   │   └── app.test.js       # Pruebas unitarias aisladas con Jest (100% pasando)
│   ├── Dockerfile            # Imagen multietapa optimizada (node:20-alpine)
│   └── .dockerignore
├── database/
│   └── init.sql              # Script SQL de creación de esquema y datos iniciales
├── frontend/                 # Servidor Web UI de Observabilidad
│   ├── public/
│   │   └── index.html        # Dashboard moderno con estado de salud y métricas
│   ├── nginx.conf            # Configuración Nginx con reverse proxy /api/
│   └── Dockerfile            # Imagen multietapa con Nginx 1.25 Alpine
├── docker-compose.yml        # Orquestación multicapa local (Front + Back + BD + Redes)
├── .gitignore                # Ignora node_modules y archivos sensibles
├── INFORME_TECNICO_DEVOPS.md # Informe técnico escrito requerido en la pauta de evaluación
├── RESUMEN_PROYECTO_DEVOPS.md# Este documento de resumen de construcción
└── README.md                 # Documentación completa para GitHub y ejecución local
```

---

## 🚀 Aspectos Técnicos Resueltos y Verificados

1. **✅ Pruebas Unitarias Ejecutadas y Aprobadas:**
   * Se ejecutó la suite de tests en Jest (`npm test`) pasando exitosamente los 4 tests unitarios de integración y endpoints.
2. **✅ Contenerización Multietapa (Docker):**
   * **Backend:** `Dockerfile` con compilación multietapa `node:20-alpine`, ejecutor no-root (`node`) y optimización de cache.
   * **Frontend:** `Dockerfile` basado en `nginx:alpine` sirviendo el sitio estático y enrutando `/api/` hacia el backend mediante reverse proxy.
3. **✅ Orquestación Local (`docker-compose.yml`):**
   * Red interna puente `devops-net`, volúmenes de persistencia para PostgreSQL (`postgres_data`) y healthcheck automatizado (`pg_isready`).
4. **✅ Pipeline CI/CD Automatizado (`.github/workflows/ci-cd.yml`):**
   * **Etapa 1 (Test):** Ejecuta tests unitarios.
   * **Etapa 2 (Build & Push):** Construye imágenes y las sube a Docker Hub / AWS ECR con etiquetas semánticas (`latest` y `v<build_number>`).
   * **Etapa 3 (Deploy AWS):** Conexión segura con credenciales de AWS y actualización en **AWS ECS / EKS**.
5. **✅ Entregable Escrito (`INFORME_TECNICO_DEVOPS.md`):**
   * Informe académico redactado con todas las justificaciones técnicas solicitadas en la pauta (VPC, Security Groups, IAM, ECS/EKS, CloudWatch, Docker, Git y Métricas).
6. **✅ Repositorio Git Inicializado:**
   * Repositorio Git configurado y listo para vincular con tu repositorio público de GitHub mediante:
     ```bash
     git remote add origin <URL_DE_TU_REPOSO_GITHUB>
     git branch -M main
     git push -u origin main
     ```

---

## 💻 ¿Cómo Probar el Proyecto Localmente?

Puedes levantar todo el entorno localmente ejecutando en la terminal (dentro de `devops_eft_project`):
```bash
docker-compose up -d --build
```
Y abrir en tu navegador:
* **Dashboard Web Frontend:** [http://localhost](http://localhost)
* **API Healthcheck:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
