import { postXp } from './postXp';

export interface receiveXp extends postXp{
    Level: number;
}

export class receiveXp implements receiveXp {

}