import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';


@Injectable()
export class TaskService {

  constructor(
    public storage: Storage
  ) {
  }

}
