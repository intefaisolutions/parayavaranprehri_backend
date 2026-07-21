import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Tree, TreeDocument } from './schemas/tree.schema';
import { CreateTreeDto } from './dto/create-tree.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';

@Injectable()
export class TreesService {
  constructor(
    @InjectModel(Tree.name) private treeModel: Model<TreeDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  private async generateTreeId(): Promise<string> {
    const counterCollection = this.connection.collection('counters');
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'treeId' as any },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    const seq = result?.seq || 1;
    return `TR-${seq.toString().padStart(4, '0')}`;
  }

  async create(createTreeDto: CreateTreeDto): Promise<Tree> {
    const treeId = await this.generateTreeId();
    const createdTree = new this.treeModel({ ...createTreeDto, treeId });
    return createdTree.save();
  }

  async findAll(): Promise<Tree[]> {
    return this.treeModel.find().exec();
  }

  async findOne(id: string): Promise<Tree> {
    const tree = await this.treeModel.findById(id).exec();
    if (!tree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }
    return tree;
  }
  
  async findByUserMobile(mobile: string): Promise<any[]> {
    const trees = await this.treeModel.find({ mobile }).exec();
    
    // Group trees by vehicleNumber for the response format
    const grouped = trees.reduce((acc, tree) => {
      const vehicleKey = tree.vehicleNumber || 'No_Vehicle';
      if (!acc[vehicleKey]) {
        acc[vehicleKey] = {
          vehicleNumber: vehicleKey,
          trees: [],
        };
      }
      acc[vehicleKey].trees.push(tree);
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped);
  }

  async update(id: string, updateTreeDto: UpdateTreeDto): Promise<Tree> {
    const existingTree = await this.treeModel
      .findByIdAndUpdate(id, updateTreeDto, { new: true })
      .exec();
    if (!existingTree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }
    return existingTree;
  }

  async remove(id: string): Promise<Tree> {
    const deletedTree = await this.treeModel.findByIdAndDelete(id).exec();
    if (!deletedTree) {
      throw new NotFoundException(`Tree with ID ${id} not found`);
    }
    return deletedTree;
  }
}
