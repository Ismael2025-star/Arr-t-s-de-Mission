import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  role!: string;

  @Column({ default: true })
  active!: boolean;
}

@Entity('missions')
export class Mission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  start!: string;

  @Column()
  end!: string;

  @Column()
  location!: string;

  @Column()
  amount!: string;

  @Column()
  financier!: string;

  @Column({ type: 'jsonb', nullable: false })
  personnes!: object;

  @Column({ nullable: true })
  file!: string;

  @Column({ default: 'pending_ministre' })
  status!: string;
}
