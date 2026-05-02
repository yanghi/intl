import { StringLocation } from "../location";

export interface DocumentMessage {
    key: string;
    value: string;
    placeholders?: PlaceholderToken[];
}


export interface PlaceholderToken {
    name: string;
    raw: string;
    location: StringLocation;
}