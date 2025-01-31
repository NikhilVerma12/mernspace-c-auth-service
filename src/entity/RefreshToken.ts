import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @ManyToOne(() => User)
  user: User; // this will create a userId column in refreshToken Table that will represent related user id

  @DeleteDateColumn()
  deletedAt: number;

  @CreateDateColumn()
  createdAt: number;
}
