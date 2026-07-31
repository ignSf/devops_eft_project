-- Base de datos inicial para la plataforma DevOps EFT (ISY1101)

CREATE TABLE IF NOT EXISTS health_status (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'General',
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales de prueba (seeding)
INSERT INTO health_status (service_name, status) VALUES 
('Frontend App', 'Healthy'),
('Backend API', 'Healthy'),
('Database Cluster', 'Healthy');

INSERT INTO system_tasks (title, description, category, status) VALUES 
('Configurar Dockerfile Multietapa', 'Optimizar imagen base a Node Alpine para reducir vulnerabilidades', 'DevOps', 'Completed'),
('Crear Workflow GitHub Actions', 'Pipeline CI/CD automatizado con etapas de Build, Test y Deploy', 'CI/CD', 'Completed'),
('Desplegar en AWS ECS/EKS', 'Orquestación de contenedores con VPC y Security Groups restringidos', 'Cloud', 'In Progress'),
('Monitoreo con CloudWatch', 'Configuración de alarmas y recolección de logs en AWS CloudWatch', 'Observability', 'Pending');
