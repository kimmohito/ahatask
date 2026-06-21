module.exports = {
    apps: [
        {
            name: "ahatask-app:3005",
            cwd: "/var/www/ahatask/ahatask",
            script: "npm",
            args: "run start -- -p 3005 -H 127.0.0.1",
            exec_mode: "fork",
            instances: 1,

            env: {
                NODE_ENV: "production",
                PORT: 3005,
                HOST: "127.0.0.1"
            },

            // Stability
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",

            // Logs
            error_file: "/var/www/ahatask/ahatask/logs/error.log",
            out_file: "/var/www/ahatask/ahatask/logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        }
    ]
};