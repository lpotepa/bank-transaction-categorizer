// src/models/Transaction.ts
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './Category';

@Entity()
export class Transaction {
  @PrimaryColumn()
  transactionId!: string;

  @Column('float')
  amount!: number;

  @Column()
  timestamp!: Date;

  @Column()
  description!: string;

  @Column()
  transactionType!: string;

  @Column()
  accountNumber!: string;

  @ManyToOne(() => Category, (category) => category.transactions, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;
}
