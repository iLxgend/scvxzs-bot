import { resourceLink } from "./resourceLink";

export interface faq {
    Id: number;
    Description: string;
    Question: string;
    Answer: string;
    ResourceLink: resourceLink
}

export class faq implements faq {

}