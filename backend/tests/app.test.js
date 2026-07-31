const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

// Mock del pool de la base de datos para pruebas unitarias aisladas
jest.mock('../src/db', () => ({
  query: jest.fn()
}));

describe('Pruebas Unitarias de Endpoints Backend API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  test('GET /api/health - debe retornar 200 y estado UP cuando la BD está respondiendo', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ now: '2025-01-01T00:00:00Z' }] });

    const response = await request(app).get('/api/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('UP');
    expect(response.body.service).toBe('devops-backend-api');
  });

  test('GET /api/metrics - debe retornar métricas de memoria y uso del sistema', async () => {
    const response = await request(app).get('/api/metrics');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('memoryUsageMB');
    expect(response.body).toHaveProperty('uptimeSeconds');
  });

  test('GET /api/tasks - debe retornar la lista de tareas guardadas', async () => {
    const mockTasks = [
      { id: 1, title: 'Test Task 1', category: 'DevOps', status: 'Completed' }
    ];
    pool.query.mockResolvedValueOnce({ rows: mockTasks });

    const response = await request(app).get('/api/tasks');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('Test Task 1');
  });

  test('POST /api/tasks - debe retornar 400 si falta el campo título', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ description: 'Sin título' });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
