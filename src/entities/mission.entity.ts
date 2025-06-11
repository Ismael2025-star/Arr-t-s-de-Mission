import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Financier } from './financier.entity';
import { Participant } from './participant.entity';

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

    @ManyToOne(() => User, user => user.missions)
    @JoinColumn({ name: 'createdById' })
    createdBy!: User;

    @Column()
    createdById!: number;

    @Column({ nullable: true })
    file?: string;

    @Column({
        type: 'enum',
        enum: ['pending_ministre', 'approved', 'rejected'],
        default: 'pending_ministre'
    })
    status!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
