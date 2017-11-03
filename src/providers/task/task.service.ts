import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { Task } from './../../models/task.model';


@Injectable()
export class TaskService {

  constructor(
    public storage: Storage
  ) { }

  getAll(): Promise<Task[]> {

    return this.storage.ready()
      .then((localForage: LocalForage) => {
        let tasks: Task[] = [];

        return this.storage.forEach((task: Task, key: string, iterationNumber: number) => {
          if (key.indexOf('tasks.') > -1) {
            tasks.push(task);
          }
        }).then(() => tasks);
      }).catch(err => console.log(err));
  }

  get(id: number): Promise<Task>{
    return this.storage.get(`task.${id}`);
  }

  create(task: Task): Promise<Task>{
    return this.storage.set(`tasks.${task.id}`, task);
  }

  update(task: Task): Promise<Task>{
    return this.create(task);
  }
}
