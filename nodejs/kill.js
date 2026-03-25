// kill.js
// A simple script to clear all Node.js processes for the current user.
// Use this on Hostinger by setting it as your Startup File temporarily.

const { exec } = require('child_process');

console.log('Attempting to kill all running node processes...');

exec('pkill -u $(whoami) node', (err, stdout, stderr) => {
    if (err) {
        console.error('Error executing pkill:', err);
        return;
    }
    console.log('Successfully sent kill signal to all node processes.');
});

// Keep the process alive for a few seconds to ensure the command finishes
setTimeout(() => {
    process.exit(0);
}, 3000);
