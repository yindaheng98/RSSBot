const { exec } = require('child_process');
const fs = require('fs');
if (fs.existsSync("../ttrss-js-api")) {
    exec('cd ../ttrss-js-api && npm install && npm run build', (err, stdout, stderr) => {
        if (err) {
            throw err
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}