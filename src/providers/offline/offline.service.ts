import { Http } from '@angular/http';
import { Network } from '@ionic-native/network';
import { Storage } from '@ionic/storage';

import { BaseModel } from "../../interfaces/base-model.interface";

export abstract class OfflineService<T extends BaseModel>{


  constructor(
    private http: Http,
    private itemApiUrl: string,
    private network: Network,
    private resourceName: string,
    private storage: Storage
  ) { }

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

  private deleteFromStorage(item: T): Promise<boolean>{
    return this.storage.remove(`${this.resourceName}.${item.id}`)
      .then(() => true);
  }

}