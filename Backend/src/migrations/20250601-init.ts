import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMigration20250601 implements MigrationInterface {
  name = 'InitMigration20250601';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "missions";');
    await queryRunner.query('DROP TABLE IF EXISTS "users";');
  }
}
