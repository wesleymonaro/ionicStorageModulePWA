import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Network } from '@ionic-native/network';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { TaskService } from '../providers/task/task.service';
import { TASK_API_URL } from "../config/task-api-url.injectiontoken";

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot({
      name: '__tasksDB',
      storeName: 'tasks',
      driverOrder: ['sqlite', 'indexddb', 'websql', 'localstorage']
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    Network,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    TaskService,
    {provide: TASK_API_URL, useValue: 'http://localhost:3000/api/v1'}
  ]
})
export class AppModule {}
