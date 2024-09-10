export interface day {
    day: string | null;
    start: string | null;
    end: string | null;
    room: string | null;
}

export interface classSchedule {
    code: string;
    section: string;
    units: string;
    faculty: string | null;
    days: day[] | null;
}

export interface schedule {
    classes: classSchedule[] | undefined;
    ay: number;
    term: number;
    start: Date;
    end: Date;
}

export interface Text {
    x: number;
    y: number;
    text: string;
}

export interface supportedTerm {
    ay: number;
    term: number;
    start: string;
    end: string;
}