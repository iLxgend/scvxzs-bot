import { applicant } from "./applicant";

export interface ticket {
    id: number;
    description: string;
    subject: string;
    applicant: applicant;
}

export class ticket implements ticket {

}