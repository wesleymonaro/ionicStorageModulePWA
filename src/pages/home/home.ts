import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { Task } from "../../models/task.model";
import { TaskService } from "../../providers/task/task.service";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  tasks: Task[] = [];

  constructor(
    public navCtrl: NavController,
    public taskService: TaskService
  ) { }

  ionViewDidLoad(){
    this.taskService.getAll()
      .then((tasks: Task[]) => {
        this.tasks = tasks;
      })
  }

}
