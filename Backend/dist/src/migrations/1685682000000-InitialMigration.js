"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialMigration1685682000000 = void 0;
class InitialMigration1685682000000 {
    name = 'InitialMigration1685682000000';
    async up(queryRunner) {
        // Create enum types first
        await queryRunner.query(`
            CREATE TYPE "user_role_enum" AS ENUM ('admin', 'ministre', 'user');
            CREATE TYPE "mission_status_enum" AS ENUM ('pending_ministre', 'approved', 'rejected');
        `);
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL PRIMARY KEY,
                "username" VARCHAR(100) NOT NULL UNIQUE,
                "password" VARCHAR NOT NULL,
                "role" user_role_enum NOT NULL DEFAULT 'user',
                "active" BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
        // Create financiers table
        await queryRunner.query(`
            CREATE TABLE "financiers" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "function" VARCHAR(100) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
        // Create missions table
        await queryRunner.query(`
            CREATE TABLE "missions" (
                "id" SERIAL PRIMARY KEY,
                "title" VARCHAR(200) NOT NULL,
                "start" DATE NOT NULL,
                "end" DATE NOT NULL,
                "location" VARCHAR(200) NOT NULL,
                "amount" DECIMAL(10,2) NOT NULL,
                "financierId" INTEGER NOT NULL REFERENCES financiers(id),
                "file" VARCHAR,
                "status" mission_status_enum NOT NULL DEFAULT 'pending_ministre',
                "createdById" INTEGER NOT NULL REFERENCES users(id),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
        // Create participants table
        await queryRunner.query(`
            CREATE TABLE "participants" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "ministere" VARCHAR(100) NOT NULL,
                "direction" VARCHAR(100) NOT NULL,
                "function" VARCHAR(100) NOT NULL,
                "startDate" DATE NOT NULL,
                "endDate" DATE NOT NULL,
                "montantAllocated" DECIMAL(10,2) NOT NULL,
                "missionId" INTEGER NOT NULL REFERENCES missions(id),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_users_role" ON "users"("role");
            CREATE INDEX "IDX_users_active" ON "users"("active");
            CREATE INDEX "IDX_missions_status" ON "missions"("status");
            CREATE INDEX "IDX_missions_createdById" ON "missions"("createdById");
            CREATE INDEX "IDX_participants_missionId" ON "participants"("missionId");
        `);
    }
    async down(queryRunner) {
        // Drop indexes
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_participants_missionId";');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_missions_createdById";');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_missions_status";');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_active";');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_role";');
        // Drop tables
        await queryRunner.query('DROP TABLE IF EXISTS "participants";');
        await queryRunner.query('DROP TABLE IF EXISTS "missions";');
        await queryRunner.query('DROP TABLE IF EXISTS "financiers";');
        await queryRunner.query('DROP TABLE IF EXISTS "users";');
        // Drop enum types
        await queryRunner.query('DROP TYPE IF EXISTS "mission_status_enum";');
        await queryRunner.query('DROP TYPE IF EXISTS "user_role_enum";');
    }
}
exports.InitialMigration1685682000000 = InitialMigration1685682000000;
