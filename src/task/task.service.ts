import { UserEntity } from 'src/user/entities/user.entity';
import { TaskEntity } from './entities/task.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ILike, IsNull, Repository } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) { }

  async createTask(userId: any, createTaskDto: CreateTaskDto) {
    let task = new TaskEntity();
    task.title = createTaskDto.title;
    task.text = createTaskDto.text;
    task.isFavorite = createTaskDto.isFavorite;
    task = await this.taskRepository.save(task);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tasks'],
    });
    user.tasks.push(task);
    await this.userRepository.save(user);
    return task;
  }

  async getAllTasks(userId: any) {
    const tasks = await this.taskRepository.find({
      where: { user: userId },
    });
    return tasks;
  }

  async findTaskById(userId: any, taskId: string) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, user: userId },
    });
    if (task) {
      return task;
    }
    return null;
  }

  async updateTask(userId: any, taskId: string, updateTaskDto: UpdateTaskDto) {
    let updateTask = await this.taskRepository.findOne({
      where: { id: taskId, user: userId },
    });
    updateTask = await this.taskRepository.save({
      ...updateTask,
      ...updateTaskDto,
    });
    if (!updateTask) {
      return null;
    }
    return updateTask;
  }

  async deleteTask(userId: any, taskId: string) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, user: userId },
    });
    if (!task) {
      return null;
    }
    const deleteResult = await this.taskRepository.remove(task);
    return deleteResult;
  }

  async updateTaskIsFavorite(userId: any, taskId: string, isFavorite: boolean) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, user: userId },
    });

    if (!task) {
      return null;
    }

    task.isFavorite = isFavorite;
    await this.taskRepository.save(task);
    return task;
  }

  async updateTaskColor(userId: any, taskId: string, color: string) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, user: userId },
    });

    if (!task) {
      return null;
    }

    task.color = color;
    await this.taskRepository.save(task);
    return task;
  }

  async findTasksByTitle(userId: any, title: string) {
    const tasks = await this.taskRepository.find({
      where: {
        user: userId,
        title: ILike(`%${title}%`), // ILike is case-insensitive
      },
    });
    return tasks;
  }

  async findTasksByColor(userId: string | any, color: string | null) {
    const formattedColor = color === "none" ? null : color;

    const whereCondition = formattedColor === null
      ? { user: userId, color: IsNull() }
      : { user: userId, color: ILike(`%${formattedColor}%`) };

    const tasks = await this.taskRepository.find({ where: whereCondition });

    // Converte color === null para "none" antes de retornar para realizar buscas de notas sem cor definida
    return tasks.map(task => ({
      ...task,
      color: task.color === null ? "none" : task.color
    }));
  }

}
