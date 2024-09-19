import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1726752379970 implements MigrationInterface {
    name = 'InitialMigration1726752379970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction" ("transactionId" character varying NOT NULL, "amount" double precision NOT NULL, "timestamp" TIMESTAMP NOT NULL, "description" character varying NOT NULL, "transactionType" character varying NOT NULL, "accountNumber" character varying NOT NULL, "category_id" integer, CONSTRAINT "PK_bdcf2c929b61c0935576652d9b0" PRIMARY KEY ("transactionId"))`);
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_abbe63b71ee4193f61c322ab497" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_abbe63b71ee4193f61c322ab497"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
    }

}
