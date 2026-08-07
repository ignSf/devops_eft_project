# 🎤 Guía Maestra de Presentación: Proyecto y Ramo DevOps (ISY1101)

Este documento está diseñado para guiarte paso a paso en tu exposición oral, combinando la **defensa de tu proyecto práctico** con el **dominio conceptual integral de la asignatura de DevOps y Cloud Architecture**.

---

## 💡 El "Elevator Pitch" Profesional (¿Qué es DevOps y qué resolvió este ramo?)

Cuando la comisión te pida presentar o introducir el ramo y tu proyecto, tu postura debe reflejar a un **Cloud & DevOps Engineer**:

> *"DevOps no es solo un conjunto de herramientas como Docker o Kubernetes; es una cultura y una metodología orientada a eliminar las barreras entre el desarrollo de software y las operaciones de TI. A lo largo del ramo y en este proyecto, hemos implementado el ciclo completo de vida del software (SDLC): desde la automatización de integraciones con Git y CI/CD, pasando por la contenerización y el hardening de microservicios, hasta la orquestación elástica en la nube de AWS con Amazon EKS, garantizando alta disponibilidad, seguridad perimetral y observabilidad continua."*

---

## ⏱️ Estructura y Distribución del Tiempo (15 Minutos)

| Bloque | Tiempo | Enfoque Principal | Diapositivas |
| :--- | :--- | :--- | :--- |
| **1. Introducción y Contexto** | 00:00 - 02:00 | Cultura DevOps, problemática del software y valor del ramo | Diapos 1 - 2 |
| **2. Contenerización y Hardening** | 02:00 - 05:00 | Docker, Multi-Stage Builds, Seguridad No-Root, Docker Compose | Diapos 3 - 4 |
| **3. Automatización CI/CD** | 05:00 - 08:00 | GitHub Actions, Git Workflows, Secrets, Push a ECR y Rolling Deploy | Diapos 5 - 6 |
| **4. Arquitectura Cloud & EKS** | 08:00 - 11:00 | VPC Multi-AZ, Subredes Privadas/Públicas, Security Groups, Pods y Services | Diapos 7 - 8 |
| **5. Demo y Observabilidad** | 11:00 - 13:30 | Dashboard Web, Endpoint `/api/metrics`, Uptime, Persistencia en DB | Diapo 9 |
| **6. Cierre y Lecciones** | 13:30 - 15:00 | Retrospectiva, Zero-Downtime, preguntas de la comisión | Diapo 10 |

---

## 📊 Guion Diapositiva por Diapositiva (Discurso Senior)

### 🟢 Diapositiva 1: Portada y Visión General de DevOps
* **Elementos Visuales:** Título del proyecto, tu nombre, logos de AWS, Kubernetes, Docker, GitHub Actions.
* **Guion de Discurso:**
  > *"Muy buenos días estimado profesor y miembros de la comisión. Soy Ignacio Salazar y hoy les presento la evaluación final del módulo de DevOps. El objetivo central de esta asignatura y de este proyecto práctico ha sido diseñar e implementar una arquitectura de microservicios resiliente, escalable y automatizada en la nube de Amazon Web Services, utilizando las mejores prácticas de la industria en CI/CD, contenerización y orquestación."*

### 🟢 Diapositiva 2: El Desafío de Ingeniería (Arquitectura Multicapa)
* **Elementos Visuales:** Diagrama de arquitectura 3 capas (Frontend Nginx $\rightarrow$ Backend Express API $\rightarrow$ Database PostgreSQL).
* **Guion de Discurso:**
  > *"Para abordar la problemática común de las arquitecturas monolíticas y rígidas, diseñamos una solución distribuida en 3 capas. En la capa de presentación tenemos una interfaz web ligera sirviéndose sobre Nginx; en la capa de lógica, un microservicio REST en Node.js; y en la capa de persistencia, una base de datos relacional PostgreSQL. Esta separación desacopla responsabilidades y nos permite escalar cada componente de forma independiente según la demanda."*

### 🟢 Diapositiva 3: Contenerización y Hardening con Docker
* **Elementos Visuales:** Fragmentos de Dockerfile (Multi-stage build) y comando `docker-compose ps`.
* **Guion de Discurso:**
  > *"En el módulo de contenerización aprendimos que construir imágenes livianas y seguras es crucial. Implementamos **Dockerfiles multietapa (Multi-Stage Builds)** usando la imagen ultra-compacta `node:20-alpine`. En la etapa de compilación se instalan dependencias y se ejecutan pruebas automatizadas; en la etapa final, solo se copian los artefactos necesarios y se ejecuta la aplicación bajo un usuario no privilegiado (`USER node`) para prevenir ataques de elevación de privilegios. Para el desarrollo local, orquestamos la solución con Docker Compose sobre una red aislada."*

### 🟢 Diapositiva 4: Automatización e Integración Continua (CI Pipeline)
* **Elementos Visuales:** Diagrama de pipeline de GitHub Actions (`job: test` $\rightarrow$ `job: build-and-push`).
* **Guion de Discurso:**
  > *"La integración continua es la primera columna vertebral de DevOps. Mediante **GitHub Actions**, configuramos un workflow que se gatilla ante cada push a la rama `main`. La primera etapa ejecuta la suite de pruebas unitarias en Jest. Si algún test falla, el pipeline interrumpe inmediatamente la ejecución, evitando que código defectuoso llegue a etapas posteriores. Una vez aprobados los tests, se construyen las imágenes Docker y se autentican de forma segura en **Amazon ECR (Elastic Container Registry)** mediante credenciales cifradas en GitHub Secrets."*

### 🟢 Diapositiva 5: Despliegue Continuo en AWS EKS (CD Pipeline)
* **Elementos Visuales:** Workflow de despliegue y comando `kubectl rollout restart`.
* **Guion de Discurso:**
  > *"El Despliegue Continuo (CD) automatiza la entrega a producción. El pipeline se conecta de manera segura al clúster administrado **Amazon EKS**, actualizando los manifiestos de Kubernetes. Aplicamos una estrategia de **Rolling Update (despliegue progresivo)**: Kubernetes levanta las nuevas réplicas, verifica su estado de salud mediante probes, y recién cuando están operativas, sustituye de forma transparente los contenedores antiguos, garantizando un despliegue **Zero-Downtime**."*

### 🟢 Diapositiva 6: Infraestructura de Redes y Seguridad Cloud (AWS VPC)
* **Elementos Visuales:** Mapa de recursos de la VPC (`devops-eks-vpc`), Subredes Públicas y Privadas, Security Groups.
* **Guion de Discurso:**
  > *"La infraestructura de red fue diseñada bajo el principio de **Defensa en Profundidad** y menor privilegio. Desplegamos una VPC Multi-AZ con subredes públicas para balanceadores de carga orientados a Internet, y subredes privadas donde residen únicamente los nodos de trabajo de Kubernetes y la base de datos PostgreSQL. A nivel de seguridad, los **Security Groups** actúan como firewalls con estado, restringiendo el acceso exclusivamente a los puertos 80, 5000 y 5432 desde orígenes autorizados."*

### 🟢 Diapositiva 7: Orquestación en Kubernetes (Pods, Services & Volumes)
* **Elementos Visuales:** Salida de `kubectl get pods,svc` y manifiestos de Kubernetes (Deployment, Service).
* **Guion de Discurso:**
  > *"En el clúster EKS, traducimos los requerimientos en objetos nativos de Kubernetes. Los **Deployments** gestionan las réplicas y el ciclo de vida de los pods; los **Services** de tipo `ClusterIP` permiten el descubrimiento y comunicación interna entre la API y la base de datos; mientras que un servicio de tipo `LoadBalancer` expone el Frontend hacia el exterior mediante una dirección DNS pública provisionada por AWS."*

### 🟢 Diapositiva 8: Demostración Funcional y Notificación de Versión
* **Elementos Visuales:** Captura del Dashboard Web con insignia v4.0 Neón y verificación de salud.
* **Guion de Discurso:**
  > *"Como evidencia de funcionamiento, desplegamos la aplicación en vivo. En el dashboard apreciamos el indicador visual del entorno en producción y la versión dinámica del sistema. Esta trazabilidad visual permite verificar en tiempo real que las actualizaciones enviadas al repositorio Git se despliegan automáticamente en la infraestructura Cloud sin intervención manual."*

### 🟢 Diapositiva 9: Persistencia y Observabilidad (Métricas & Healthchecks)
* **Elementos Visuales:** Captura del endpoint `/api/metrics` y consulta a PostgreSQL.
* **Guion de Discurso:**
  > *"Sin observabilidad no hay DevOps. El backend expone endpoints estratégicos: `/api/health` para verificaciones de disponibilidad en Kubernetes, y `/api/metrics` para auditar métricas del sistema en tiempo real, tales como Uptime, consumo de memoria Heap y RSS. Asimismo, verificamos la integración relacional con PostgreSQL, asegurando la persistencia de datos mediante volúmenes del clúster."*

### 🟢 Diapositiva 10: Conclusión y Cierre
* **Elementos Visuales:** Matriz de cumplimiento de aprendizajes y resumen de logros.
* **Guion de Discurso:**
  > *"En conclusión, este proyecto demuestra cómo la convergencia de la metodología DevOps, la contenerización con Docker, la automatización CI/CD con GitHub Actions y la orquestación en la nube con AWS EKS permite entregar software de manera continua, segura y confiable. Agradezco su atención y quedo a su disposición para responder sus preguntas."*

---

## 🎯 Frases y Vocabulario Técnico para Usar (Para Sonar Senior)

Utiliza estas expresiones estratégicas durante tu presentación:
- **"Defensa en profundidad":** Al explicar la VPC, subredes privadas y Security Groups.
- **"Despliegue Zero-Downtime":** Al explicar cómo Kubernetes sustituye pods sin caída de servicio.
- **"Hardening de contenedores":** Al explicar el uso de Alpine Linux, no-root users y multi-stage builds.
- **"Inmutabilidad de infraestructura":** Al explicar que los contenedores no se editan en caliente, sino que se reemplazan imágenes etiquetadas.
- **"Shift-Left Security / Testing":** Al explicar que los tests se ejecutan al principio del pipeline CI para detectar fallos tempranos.
- **"Trazabilidad de builds":** Al mencionar que cada imagen en ECR tiene la etiqueta del hash de Git o número de build.

---

## ❓ Preguntas de Examen / Defensa y Respuestas Pro

1. **¿Qué diferencia hay entre Docker Compose y Kubernetes/EKS?**
   * *Respuesta Senior:* "Docker Compose es una herramienta de orquestación de un solo nodo, excelente para entornos de desarrollo local. Kubernetes/EKS es un orquestador distribuido empresarial que ofrece autosescalamiento (HPA), autorreparación (self-healing), balanceo de carga avanzado y gestión en clúster multinodo."

2. **¿Por qué ubicar la base de datos y la API en subredes privadas?**
   * *Respuesta Senior:* "Por el principio de menor privilegio e aislamiento de red. La API y la base de datos no deben ser accesibles directamente desde Internet. Solo el Ingress/LoadBalancer en la subred pública recibe peticiones de usuarios y las enruta internamente."

3. **¿Cómo se manejan las credenciales de base de datos o claves API en DevOps?**
   * *Respuesta Senior:* "Nunca se escriben en duro (hardcoded) en el código. En CI/CD se usan **GitHub Secrets**, y en Kubernetes se inyectan como variables de entorno a través de objetos **Secrets / ConfigMaps** cifrados."

4. **Si el pipeline de CI/CD falla en la etapa de Test, ¿qué ocurre con la versión en producción?**
   * *Respuesta Senior:* "Nada. El pipeline se aborta inmediatamente (fail-fast). Producción continúa corriendo la versión anterior estable sin verse afectada en absoluto."
