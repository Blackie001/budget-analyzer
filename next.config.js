/** @type {import('next').NextConfig} */
const nextConfig = {
    // SQLite binary issues sometimes need this in newer Node/Next versions, but usually fine.
    // We'll leave it simple for now.
    webpack: (config) => {
        config.externals.push({
            "better-sqlite3": "commonjs better-sqlite3",
        });
        return config;
    },
};

module.exports = nextConfig;
