import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    // webpack(config, { isServer }) {
    //     if (isServer) {
    //         // Push pg-format onto externals so webpack leaves `require('pg-format')` alone
    //         config.externals = [
    //             ...(typeof config.externals === 'function'
    //                 ? []              // custom externals-as-function—skip
    //                 : config.externals),
    //             'pg-format',
    //         ];
    //     }
    //     return config;
    // },
    serverExternalPackages: ['pg-format'],
};

export default nextConfig;
