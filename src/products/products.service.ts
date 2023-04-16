import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PaginationDto } from '../common/dtos/pagination.dto';

import { validate as isUUID } from 'uuid'
import { Product, ProductImage } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly ProductImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) { }


  async create(createProductDto: CreateProductDto, user: User) {

    try {

      const { images = [], ...productDetails } = createProductDto;//desestrurar la data 


      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(images => this.ProductImageRepository.create({ url: images })) // add a la db
        , user: user
      });

      await this.productRepository.save(product); //guarda todo
      // return product; //opt1
      return { ...product, images }

    } catch (error) {
      this.handleDBException(error)
    }

  }

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    //Opt 1
    // return await this.productRepository.find({
    //   take: limit,
    //   skip: offset,
    //   //TODO relaciones
    //   relations: {
    //     images: true
    //   }
    // });
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO relaciones
      relations: {
        images: true
      }
    });

    return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
    }))
  }

  async findOne(term: string) {
    let product: Product;


    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {

      const queryBuilder = this.productRepository.createQueryBuilder('prod');//add 'prod' alias para mostrar la relacion'
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();

    }

    if (!product)
      throw new NotFoundException(`Product with  ${term} not found`)

    return product;
  }
  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);

    return {
      ...rest,
      images: images.map(images => images.url)
    }
  }



  async update(id: string, updateProductDto: UpdateProductDto, user: User) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate })

    if (!product) throw new NotFoundException(`Product with id ${id} not found`)

    //Create query runner

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        //con esta borramos las anteriores para add
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map(
          images => this.ProductImageRepository.create({ url: images })
        )
      }
      product.user = user;
      await queryRunner.manager.save(product); //no esta add en la base de datos todavia
      // await this.productRepository.save(product)
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);
      // return product;

    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release();

      this.handleDBException(error);
    }


  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);

    return `This action removes a #${id} product`;
  }

  private handleDBException(error: any) {

    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('unespected error, check server logs')


  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {

      this.handleDBException(error)
    }

  }

}