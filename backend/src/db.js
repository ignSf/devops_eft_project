const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'devops_user',
  password: process.env.DB_PASSWORD || 'devops_pass123',
  database: process.env.DB_NAME || 'devops_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_tasks (
          id SERIAL PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'General',
          status VARCHAR(20) DEFAULT 'Pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const check = await pool.query('SELECT COUNT(*) FROM system_tasks');
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO system_tasks (title, description, category, status) VALUES 
        ('Configurar Dockerfile Multietapa', 'Optimizar imagen base a Node Alpine para reducir vulnerabilidades', 'DevOps', 'Completed'),
        ('Crear Workflow GitHub Actions', 'Pipeline CI/CD automatizado con etapas de Build, Test y Deploy', 'CI/CD', 'Completed'),
        ('Desplegar en AWS ECS/EKS', 'Orquestación de contenedores con VPC y Security Groups restringidos', 'Cloud', 'Completed'),
        ('Monitoreo de Infraestructura', 'Configuración de observabilidad y métricas de salud en AWS', 'Observability', 'In Progress');
      `);
      console.log('✅ Base de datos PostgreSQL inicializada con tareas de prueba.');
    }
  } catch (err) {
    console.error('⚠️ Error al inicializar DB:', err.message);
  }
}

initDb();

module.exports = pool;
