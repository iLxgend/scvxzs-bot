import { applicant } from "./applicant";

export interface ticket {
    description: string;
    subject: string;
    applicant: applicant;
}

export class ticket implements ticket {

}