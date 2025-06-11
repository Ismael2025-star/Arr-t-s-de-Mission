import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Mission } from './Mission';

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
        enum: ['admin', 'ministre', 'secretaire', 'user'],
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
