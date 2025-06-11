import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntities1748867177736 implements MigrationInterface {
    name = 'UpdateEntities1748867177736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "participants_missionId_fkey"`);
        await queryRunner.query(`ALTER TABLE "missions" DROP CONSTRAINT "missions_financierId_fkey"`);
        await queryRunner.query(`ALTER TABLE "missions" DROP CONSTRAINT "missions_createdById_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_participants_missionId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_missions_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_missions_createdById"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_active"`);
        await queryRunner.query(`ALTER TYPE "public"."mission_status_enum" RENAME TO "mission_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."missions_status_enum" AS ENUM('pending_ministre', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "missions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "missions" ALTER COLUMN "status" TYPE "public"."missions_status_enum" USING "status"::"text"::"public"."missions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "missions" ALTER COLUMN "status" SET DEFAULT 'pending_ministre'`);
        await queryRunner.query(`DROP TYPE "public"."mission_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'ministre', 'secretaire', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_31663733b192e0e5af0d25fd9ca" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "missions" ADD CONSTRAINT "FK_53d63d0169da7d1f2d3dbe685c4" FOREIGN KEY ("financierId") REFERENCES "financiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "missions" ADD CONSTRAINT "FK_ed7a3079e1c55edffb0f878a95c" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "missions" DROP CONSTRAINT "FK_ed7a3079e1c55edffb0f878a95c"`);
        await queryRunner.query(`ALTER TABLE "missions" DROP CONSTRAINT "FK_53d63d0169da7d1f2d3dbe685c4"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_31663733b192e0e5af0d25fd9ca"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "active" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('admin', 'ministre', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."mission_status_enum_old" AS ENUM('pending_ministre', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "missions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "missions" ALTER COLUMN "status" TYPE "public"."mission_status_enum_old" USING "status"::"text"::"public"."mission_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "missions" ALTER COLUMN "status" SET DEFAULT 'pending_ministre'`);
        await queryRunner.query(`DROP TYPE "public"."missions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."mission_status_enum_old" RENAME TO "mission_status_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_users_active" ON "users" ("active") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_missions_createdById" ON "missions" ("createdById") `);
        await queryRunner.query(`CREATE INDEX "IDX_missions_status" ON "missions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_participants_missionId" ON "participants" ("missionId") `);
        await queryRunner.query(`ALTER TABLE "missions" ADD CONSTRAINT "missions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "missions" ADD CONSTRAINT "missions_financierId_fkey" FOREIGN KEY ("financierId") REFERENCES "financiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "participants_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
