// Super simple test to see if React loads at all
import { logger } from './services/Logger';
logger.debug('main-simple.tsx loading...');

const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="
      padding: 2rem;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
      font-family: Arial, sans-serif;
    ">
      <h1>✅ JavaScript is Working!</h1>
      <p>React module loaded successfully</p>
      <button onclick="alert('Click works!')">Test Button</button>
    </div>
  `;
  logger.debug('Root element updated successfully');
} else {
  logger.error('Root element not found!');
}