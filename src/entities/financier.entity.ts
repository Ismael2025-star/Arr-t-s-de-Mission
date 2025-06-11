import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Mission } from './mission.entity';

@Entity('financiers')
export class Financier extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column({ length: 100 })
    function!: string;

    @OneToMany(() => Mission, mission => mission.financier)
    missions!: Mission[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
