const { spawn } = require('child_process');
const path = require('path');

const startPitchService = () => {
  const pitchServicePath = path.join(__dirname, 'ml-models', 'Elevator Pitch');
  
  console.log('Starting Elevator Pitch service...');
  
  const pythonProcess = spawn(process.env.PYTHON_PATH || 'python', ['main.py'], {
    cwd: pitchServicePath,
    stdio: 'inherit'
  });
  
  pythonProcess.on('error', (error) => {
    console.error('Failed to start Elevator Pitch service:', error);
  });
  
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Elevator Pitch service exited with code ${code}`);
    }
  });
  
  return pythonProcess;
};

module.exports = startPitchService;