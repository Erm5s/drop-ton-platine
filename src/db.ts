import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant dans le .env");
}

// Connexion à Postgres avec le driver pg
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Instance Prisma utilisée partout
export const prisma = new PrismaClient({ adapter });
