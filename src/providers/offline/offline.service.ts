import { Http } from '@angular/http';
import { Network } from '@ionic-native/network';
import { Storage } from '@ionic/storage';
import { BehaviorSubject } from 'rxjs';

import { BaseModel } from "../../interfaces/base-model.interface";
import { Update } from "../../types/update.type";

export abstract class OfflineService<T extends BaseModel>{

  protected listItems$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
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
    this.getItemsFromCache();
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

  private removeUpdate(update: Update<T>): Promise<void> {
    return this.storage.remove(`updates.${this.resourceName}.${update.value.id}`)
      .then(() => {
        this.updates.splice(this.updates.indexOf(update), 1);
      })
  }

  private getUpdatesFromStorage(): Promise<Update<T>[]> {
    return this.storage.ready()
      .then((localForage: LocalForage) => {
        let items: T[] = [];

        return this.storage.forEach((value: any, key: string, iterationNumber: number) => {
          if (key.indexOf(`updates.${this.resourceName}.`) > -1) {
            this.updates.push(value);
          }
        }).then(() => {
          return this.updates;
        })
      })
  }

  private getItemsFromCache(): Promise<void> {
    if ('caches' in window) {
      return self.caches.match(`${this.itemApiUrl}/${this.resourceName}`)
        .then((response) => {
          if (response) {
            return response
              .json()
              .then(cachedJson => {
                if (cachedJson.timestamp > this.lastUpdate) {
                  this.listItems$.next(cachedJson.data);
                  //this.setLastUpdate(cachedJson.timestamp);
                }
              })
          }
        })
    } else {
      return Promise.resolve();
    }
  }

}