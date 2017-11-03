import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { Task } from "../../models/task.model";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  tasks: Task[] = [
    new Task("Estudar Angular"),
    new Task("Estudar Ionic")
  ];

  constructor(public navCtrl: NavController) {

  }

}
