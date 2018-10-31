import * as discord from 'discord.js';


export class ticketDialogue {

    /**
     * titleStep
     */
    public titleStep(response:discord.Message, data:ticketDialogueData) {

        return new Promise<ticketDialogueData>((resolve, reject) => {
            try {
                data.title = response.content;
                return resolve(data);
            } catch(e) {
                return reject(e);
            }
        });
    }

    /**
     * descriptionStep
     */
    public descriptionStep(response:discord.Message, data:ticketDialogueData) {

        return new Promise<ticketDialogueData>((resolve, reject) => {
            try {
                data.description = response.content;
                return resolve(data);
            } catch(e) {
                return reject(e);
            }
        });
    }
    
    /**
     * categoryStep
     */
    public categoryStep(response:string, data:ticketDialogueData) {

        return new Promise<ticketDialogueData>((resolve, reject) => {
            try {
                data.category = response;
                return resolve(data);
            } catch(e) {
                return reject(e);
            }
        });
    }
}


export interface ticketDialogueData {
    title:string;
    description:string;
    category:string;
}

export class ticketDialogueData implements ticketDialogueData {

}