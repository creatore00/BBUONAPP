const portscanner = require('portscanner');
const { exec } = require('child_process');

const port = process.env.PORT || 11558; // Change to your default port

portscanner.checkPortStatus(port, '127.0.0.1', (error, status) => {
    if (status === 'open') {
        console.log(`Port ${port} is in use. Finding the process using the port...`);
        
        exec(`lsof -i :${port} -t`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error finding the process using port ${port}: ${err.message}`);
                return;
            }

            const pid = stdout.trim();
            if (pid) {
                console.log(`Killing process with PID: ${pid}`);
                exec(`kill -9 ${pid}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Error killing process with PID ${pid}: ${err.message}`);
                        return;
                    }
                    console.log(`Process with PID ${pid} killed`);
                });
            } else {
                console.log(`No process found using port ${port}`);
            }
        });
    } else {
        console.log(`Port ${port} is available`);
    }
});
