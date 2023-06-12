/** @type {import('next').NextConfig} */
const withAxiom = require('@axiomhq/nextjs')

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withAxiom(nextConfig);
