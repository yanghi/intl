export interface Location {
    filePath: string;
    line: number;
    column: number;
}

export interface StringLocation {
    start: Location;
    end: Location;
}