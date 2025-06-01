"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitMigration20250601 = void 0;
class InitMigration20250601 {
    name = 'InitMigration20250601';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "role" VARCHAR NOT NULL,
        "active" BOOLEAN DEFAULT true
      );
      CREATE TABLE "missions" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR NOT NULL,
        "start" VARCHAR NOT NULL,
        "end" VARCHAR NOT NULL,
        "location" VARCHAR NOT NULL,
        "amount" VARCHAR NOT NULL,
        "financier" VARCHAR NOT NULL,
        "personnes" JSONB NOT NULL,
        "file" VARCHAR,
        "status" VARCHAR DEFAULT 'pending_ministre'
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "missions";');
        await queryRunner.query('DROP TABLE IF EXISTS "users";');
    }
}
exports.InitMigration20250601 = InitMigration20250601;
