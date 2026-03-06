import type { Project } from "../interfaces/projects";

export const otherProjects: Project[] = [
    {
        title: "GitHub-to-Discord Webhook Gateway",
        description: "A high-performance integration service built with Node.js, TypeScript, and Express. It acts as a specialized middleware that listens to GitHub Webhooks, processes repository events (Push, Pull Requests, Issues), and delivers real-time, formatted notifications to Discord channels.",
        link: "https://github.com/DiogenesFerminS/node-webhooks-discord-server"
    },
    {
        title: "Enterprise PDF Generation Service",
        description:"A robust backend service architected with NestJS and PostgreSQL, designed to automate the generation of complex corporate documents. Leveraging TypeORM for seamless relational data management and pdfMake for the rendering engine, the API enables dynamic PDF creation. Features include personalized employment certificates with real-time employee data injection, and comprehensive country reports filtered by unique identifiers directly from the database.",
        link: "https://github.com/DiogenesFerminS/reports_nestjs"
    }
]