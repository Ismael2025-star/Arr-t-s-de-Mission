import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Mission } from './Mission';

@Entity('participants')
export class Participant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column({ length: 100 })
    ministere!: string;

    @Column({ length: 100 })
    direction!: string;

    @Column({ length: 100 })
    function!: string;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'date' })
    endDate!: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    montantAllocated!: number;

    @ManyToOne(() => Mission, mission => mission.participants)
    @JoinColumn({ name: 'missionId' })
    mission!: Mission;

    @Column()
    missionId!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
