const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Microservicio Backend iniciado en el puerto ${PORT}`);
  console.log(`📡 Healthcheck disponible en: http://localhost:${PORT}/api/health`);
});
