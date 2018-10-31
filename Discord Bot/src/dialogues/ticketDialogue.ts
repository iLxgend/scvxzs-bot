
export class ticketDialogue {

    /**
     * titleStep
     */
    public titleStep(response:string, data:ticketDialogueData) {

        return new Promise<ticketDialogueData>((resolve, reject) => {
            try {
                data.title = response;
                return resolve(data);
            } catch(e) {
                return reject(e);
            }
        });
    }

    /**
     * descriptionStep
     */
    public descriptionStep(response:string, data:ticketDialogueData) {

        return new Promise<ticketDialogueData>((resolve, reject) => {
            try {
                data.description = response;
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