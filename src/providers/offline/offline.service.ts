import { Http } from '@angular/http';
import { Network } from '@ionic-native/network';
import { Storage } from '@ionic/storage';

import { BaseModel } from "../../interfaces/base-model.interface";
import { Update } from "../../types/update.type";

export abstract class OfflineService<T extends BaseModel>{

  private updates: Update<T>[];
  private lastUpdate: number = 0;


  constructor(
    private http: Http,
    private itemApiUrl: string,
    private network: Network,
    private resourceName: string,
    private storage: Storage
  ) {
    this.init();
  }

  private init(): void {
    this.updates = [];
  }

  private getAllFromStorage(): Promise<T[]> {
    return this.storage.ready()
      .then((localForage: LocalForage) => {
        let items: T[] = [];

        return this.storage.forEach((value: any, key: string, iterationNumber: number) => {
          if (key.indexOf(`${this.resourceName}.`) > -1) {
            items.push(value);
          }
        }).then(() => {
          return items;
        })
      })
  }

  private saveInStorage(item: T): Promise<T> {
    return this.storage.set(`${this.resourceName}.${item.id}`, item);
  }

  private deleteFromStorage(item: T): Promise<boolean> {
    return this.storage.remove(`${this.resourceName}.${item.id}`)
      .then(() => true);
  }

  private getFromStorage(id: number): Promise<T> {
    return this.storage.get(`${this.resourceName}.${id}`);
  }

  private saveAllInStorage(items: T[]): Promise<T[]> {
    let promises: Promise<T>[] = [];

    items.forEach((item: T) => {
      promises.push(this.saveInStorage(item));
    });

    return Promise.all(promises);

  }

  private addUpdate(update: Update<T>): Promise<Update<T>> {
    return this.storage.set(`updates.${this.resourceName}.${update.value.id}`, update)
      .then((update: Update<T>) => {
        this.updates.push(update);
        
        //sync with server
        return update;
      })
  }

}