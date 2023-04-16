import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
import { Product } from '../../products/entities';

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column("text", {
        unique: true
    })
    email: string;

    @Column("text", {
        select: false
    })
    password: string;

    @Column("text")
    fullName: string;

    @Column("bool", {
        default: true
    })
    isActive: string;

    @Column("text", {
        array: true,
        default: ['user']
    })
    role: string[];

    @OneToMany(
        () => Product,
        (product) => product.user
    )
    product: Product



    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();
    }




}


