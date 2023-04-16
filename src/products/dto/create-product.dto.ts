import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, MinLength, IsIn } from "class-validator";

export class CreateProductDto {


    @ApiProperty({
        description: 'Product title (unique)',
        nullable: false,
        minLength: 1
    })
    @IsString()
    @MinLength(1)
    title: string;

    @ApiProperty()
    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty()
    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?: number;

    @ApiProperty()
    @IsString({ each: true }) // each obligar que cada variable sea string
    @IsArray()
    sizes: string[];

    @ApiProperty()
    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender: string;

    @ApiProperty()
    @IsString({ each: true }) // each obligar que cada variable sea string
    @IsArray()
    @IsOptional()
    tags: string[];

    @IsString({ each: true }) // each obligar que cada variable sea string
    @IsArray()
    @IsOptional()
    images?: string[];





}
