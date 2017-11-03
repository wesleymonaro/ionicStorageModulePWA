import { Injectable, Inject } from '@angular/core';
import { Storage } from '@ionic/storage';

import { Task } from './../../models/task.model';
import { TASK_API_URL } from "../../config/task-api-url.injectiontoken";
import { OfflineService } from "../offline/offline.service";
import { Http } from "@angular/http";
import { Network } from "@ionic-native/network";


@Injectable()
export class TaskService extends OfflineService<Task>{

  constructor(
    http: Http,
    network: Network,
    storage: Storage,
    @Inject(TASK_API_URL) taskApiUrl: string
  ) { 
    super(http, taskApiUrl, network, 'tasks', storage);
  }

  get(id: number): Promise<Task>{
    return super.getFromStorage(id);
  }

  create(task: Task): Promise<Task>{
    return super.createInServer(task);
  }

  update(task: Task): Promise<Task>{
    return super.updateInServer(task);
  }

  delete(task: Task): Promise<void>{
    return super.deleteInServer(task)
  }
}
