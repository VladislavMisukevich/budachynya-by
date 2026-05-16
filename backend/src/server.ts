import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('');
  console.log('  🚀 Будучыня.BY Backend запущен!');
  console.log(`  📡 URL:  http://localhost:${PORT}`);
  console.log(`  ❤️  Health: http://localhost:${PORT}/api/health`);
  console.log('');
});