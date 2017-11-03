import { Headers, Http, Response } from '@angular/http';
import { Network } from '@ionic-native/network';
import { Storage } from '@ionic/storage';
import { BehaviorSubject, Observable } from 'rxjs';
import 'rxjs/add/operator/toPromise';

import { BaseModel } from "../../interfaces/base-model.interface";
import { Update } from "../../types/update.type";

export abstract class OfflineService<T extends BaseModel>{

  protected listItems$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
  private headers: Headers = new Headers({
    'Content-Type': 'application/json'
  })
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

  private synchronize():void{
    this.syncPushingToServer()
      .then((updates: Update<T>[]) => {
        this.syncPullingFromServer();
      })
  }

  private getAllFromStorage(): Promise<T[]> {
    return this.storage.ready()
      .then((localForage: LocalForage) => {

        let items: T[] = [];

        return this.storage.forEach((value: any, key: string, iterationNumber: number) => {
          if (key.indexOf(`${this.resourceName}.`) > -1 && key.indexOf('updates.') == -1) {
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
        this.syncPushingToServer();
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
                  this.setLastUpdate(cachedJson.timestamp);
                }
              })
          }
        })
    } else {
      return Promise.resolve();
    }
  }

  private saveInServer(update: Update<T>): Observable<any> {
    let url: string = `${this.itemApiUrl}/${this.resourceName}`;
    let responseObservable: Observable<Response>

    switch (update.method) {
      case 'put':
        url += `/${update.value.id}`;
      case 'post':
        responseObservable = this.http[update.method](url, JSON.stringify(update.value), { headers: this.headers });
        break;
      case 'delete':
        url += `/${update.value.id}`;
        responseObservable = this.http.delete(url, { headers: this.headers });
        break;
    }
    return responseObservable.map((response: Response) => response.json());
  }

  protected createInServer(item: T): Promise<T> {
    return this.saveInStorage(item)
      .then((item: T) => {

        this.addUpdate(
          new Update<T>('post', item)
        ).then((update: Update<T>) => {
          let items: T[] = this.listItems$.getValue();
          this.listItems$.next(items);
        })

        return item;
      })
  }

  protected updateInServer(item: T): Promise<T> {
    item.synchronized = false;
    return this.saveInStorage(item)
      .then((item: T) => {
        this.addUpdate(
          new Update<T>('put', item)
        );
        return item;
      })
  }

  protected deleteInServer(item: T): Promise<void> {
    return this.deleteFromStorage(item)
      .then((deleted: boolean) => {
        this.addUpdate(
          new Update<T>('delete', item)
        ).then((update: Update<T>) => {
          this.listItems$.getValue().splice(this.listItems$.getValue().indexOf(item), 1);
        })
      })
  }

  private syncPushingToServer(): Promise<Update<T>[]> {
    let promises: Promise<Update<T>>[] = [];

    this.updates.forEach((update: Update<T>) => {

      promises.push(
        this.saveInServer(update)
          .toPromise()
          .then((serverData: any) => {

            this.setLastUpdate(serverData.timestamp);
            this.removeUpdate(update);
            if (update.method !== 'delete') {
              this.setSynchronized(serverData.data.id, true);
            }

            return update;
          }).catch((error: Error) => {
            console.log("Error sending request to server. ", error, update);
          })
      );

    })

    return Promise.all(promises);
  }

  private syncPullingFromServer(): Promise<T[]> {
    return this.http.get(`${this.itemApiUrl}/${this.resourceName}`)
      .map((response: Response) => response.json())
      .toPromise()
      .then((serverData: any) => {

        if (serverData.timestamp > this.lastUpdate) {
          this.setLastUpdate(serverData.timestamp);
          return this.saveAllInStorage(serverData.data)
            .then((items: T[]) => {
              this.listItems$.next(items);
              //clean storage
              this.cleanStorage(items);
              return items;
            })
        }

        return serverData.data;
      }).catch((err: Error) => console.log("Error fetching data from server: ", err))
  }

  private cleanStorage(serverItems: T[]): void {
    if (this.lastUpdate > 0) {
      this.getAllFromStorage()
        .then((storageItems: T[]) => {

          let itemsToDelete: T[] = storageItems.filter((storageItem: T) => {
            return !serverItems.some((serverItem: T) => serverItem.id === storageItem.id);
          });

          itemsToDelete.forEach((itemToDelete: T) => {
            this.deleteFromStorage(itemToDelete);
          });

        });
    }
  }

  private setSynchronized(index: number | string, synchronized: boolean): void {
    let items: T[] = this.listItems$.getValue();
    for (let i: number = 0; i < items.length; i++) {
      let item: T = items[i];
      if (item.id === index) {
        item.synchronized = synchronized;

        this.saveInStorage(item)
          .then(() => {
            this.listItems$.next(items);
          });
        break;
      }
    }
  }

  private setLastUpdate(timestamp: number): void {
    this.lastUpdate = timestamp;
  }

}