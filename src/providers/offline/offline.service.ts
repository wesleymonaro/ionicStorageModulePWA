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
    ){ }

}