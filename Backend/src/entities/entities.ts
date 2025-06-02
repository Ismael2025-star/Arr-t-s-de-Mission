import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, length: 100 })
    username!: string;

    @Column()
    password!: string;

    @Column({
        type: 'enum',
        enum: ['admin', 'ministre', 'user'],
        default: 'user'
    })
    role!: string;

    @Column({ default: true })
    active!: boolean;

    @OneToMany(() => Mission, mission => mission.createdBy)
    missions!: Mission[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

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

@Entity('missions')
export class Mission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 200 })
    title!: string;

    @Column({ type: 'date' })
    start!: Date;

    @Column({ type: 'date' })
    end!: Date;

    @Column({ length: 200 })
    location!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @ManyToOne(() => Financier, financier => financier.missions)
    @JoinColumn({ name: 'financierId' })
    financier!: Financier;

    @Column()
    financierId!: number;

    @OneToMany(() => Participant, participant => participant.mission)
    participants!: Participant[];

    @Column({ nullable: true })
    file!: string;

    @Column({
        type: 'enum',
        enum: ['pending_ministre', 'approved', 'rejected'],
        default: 'pending_ministre'
    })
    status!: string;

    @ManyToOne(() => User, user => user.missions)
    @JoinColumn({ name: 'createdById' })
    createdBy!: User;

    @Column()
    createdById!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
