import {classSchedule, day, schedule, supportedTerm, Text} from "./interfaces.ts";
import * as ics from 'ics'
import {createEvents} from "ics";



export async function extractClassesFromPDF(url: string, schedule: schedule): Promise<schedule> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const uint8array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    const whole = decoder.decode(uint8array);

    let start = whole.indexOf("(FACULTY)");
    start = whole.indexOf("BT", start) + 3;
    const end = whole.indexOf("(        For DLSU internal use \\(payment purposes\\) only.)");

    const part = whole.substring(start, end);


    const lines = part.split('\n');
    const result = [] as Text[];

    const regex = /(-?\d+(\.\d+)?) (-?\d+(\.\d+)?) Td \((.*?)\) Tj/;
    const noTextRegex = /(-?\d+(\.\d+)?) (-?\d+(\.\d+)?) Td/;

    for (const line of lines) {
        const match = regex.exec(line);
        if (match) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, x, , y, , text] = match;
            result.push({
                x: parseFloat(x),
                y: parseFloat(y),
                text: text
            });
        } else {
            const noTextMatch = noTextRegex.exec(line);
            if (noTextMatch) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [_, x, , y] = noTextMatch;
                result.push({
                    x: parseFloat(x),
                    y: parseFloat(y),
                    text: ''
                });
            }
        }
    }

    const classes: classSchedule[] = [];


    let xOffset = 0;
    let newCourse = 0;
    for (const text of result) {
        if(newCourse === -1){
            break;
        }

        xOffset += text.x;
        if (!text.text)
            continue

        const currIndex = classes.length - 1;
        switch (xOffset) {
            case 40: {
                classes.push({} as classSchedule);
                newCourse = 1;
                break;
            }
            case 60: {
                if(newCourse === 1){
                    newCourse = 0;
                    classes[currIndex].code = text.text;
                }
                else{
                    newCourse = -1;
                }
                break;
            }
            case 140: {
                classes[currIndex].section = text.text;
                break
            }
            case 200: {
                classes[currIndex].units = text.text;
                break
            }
            case 230: {
                if (classes[currIndex].days === undefined) {
                    classes[currIndex].days = [] as day[];
                }

                if (!text.text)
                    continue

                classes[currIndex].days?.push({} as day);
                // @ts-expect-error Will add error handling later
                classes[currIndex].days[classes[currIndex].days.length - 1].day = text.text;
                break;
            }
            case 290: {
                if (!text.text)
                    continue

                const time = text.text.split("-");
                // @ts-expect-error Will add error handling later
                classes[currIndex].days[classes[currIndex].days.length - 1].start = time[0];
                // @ts-expect-error Will add error handling later
                classes[currIndex].days[classes[currIndex].days.length - 1].end = time[1];


                break;
            }
            case 350: {
                if (!text.text) {
                    // @ts-expect-error Will add error handling later
                    classes[currIndex].days[classes[currIndex].days.length - 1].room = null;
                    continue;
                }

                // @ts-expect-error Will add error handling later
                classes[currIndex].days[classes[currIndex].days.length - 1].room = text.text;

                break;
            }
            case 400: {
                if (!text.text) {
                    classes[currIndex].faculty = null;
                    continue;
                }

                classes[currIndex].faculty = text.text;
                break;
            }
            default: {
                newCourse = -1;
            }

        }

    }


    schedule.classes = classes;
    return schedule;
}
export async function extractYearTermFromPDF(url: string | null): Promise<{ ay: number; term: number }| null> {
    if(!url){
        return null;
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const uint8array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    const whole = decoder.decode(uint8array);

    let start: number = whole.indexOf("(STUDENT ENROLLMENT RECORD)");
    if(start === -1){
        throw new Error("Not recognized as an EAF");
    }

    start = whole.indexOf("AY") + 3;
    if(start === -1){
        throw new Error("Problem reading AY");
    }
    const details = whole.substring(start,start+17);
    const tokens = details.split(", Term ");
    const academicYear = tokens[0].split("-");

    const ay = parseInt(academicYear[0]);
    const term = parseInt(tokens[1]);

    return { ay, term };
}
export async function termIsSupported({ay, term}: {ay: number, term: number}):Promise<{ start: string, end:string }|null> {
    let supportedTerms: supportedTerm[] = [];

    try {
        const response = await fetch('/terms.json');
        if (!response.ok) {
            throw new Error();
        }
        supportedTerms = await response.json();

        // Check if any term meets your criteria
        for (const supportedTerm of supportedTerms) {
            // Example condition: update this with your actual logic
            if (supportedTerm.ay === ay && supportedTerm.term === term) {
                return {start: supportedTerm.start, end: supportedTerm.end};
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        throw new Error("Problem fetching supported terms");
    }

    return null;
}



export async function createICS(schedule: schedule): Promise<string> {
    // @ts-expect-error is checked before call (not very good for future proofing, I know)
    const events = schedule.classes.flatMap(currClass => {
        const classes: { title: string; start: number[]; end: number[]; recurrenceRule: string; }[] = [];
        if (currClass.days && currClass.days.length > 0) {
            currClass.days.forEach(day => {
                if (day.day == null) {
                    return;
                }
                const startDate = getSoonestDate(schedule.start, day.day);
                classes.push({
                    title: `${currClass.code} ${currClass.section} - ${day.room}`,
                    start: day.start ? dateToICSArrayWithTime(startDate, day.start) : dateToICSArrayWithTime(startDate, "0000"),
                    end: day.end ? dateToICSArrayWithTime(startDate, day.end) : dateToICSArrayWithTime(startDate, "2359"),
                    recurrenceRule: day.day.length === 1 ? "FREQ=WEEKLY;INTERVAL=1;UNTIL="+formatDateToICS(schedule.end) : "FREQ=WEEKLY;INTERVAL=1;COUNT=1"
                });
            });
        }
        return classes;
    });

    try{
       return createICSFile(events);
    }catch(error){
        throw new Error('Error creating ICS file: ' + error)
    }

}

function getSoonestDate(startDate: Date, dayChar: string): Date {
    const daysOfWeek = ['M', 'T', 'W', 'H', 'F', 'S'];

    // Check if dayChar is in the format MMMDD
    const datePattern = /^[A-Z]{3}\d{2}$/;
    if (datePattern.test(dayChar)) {
        const monthAbbr = dayChar.slice(0, 3);
        const day = parseInt(dayChar.slice(3), 10);

        // Convert month abbreviation to month index
        const monthIndex = new Date(`${monthAbbr} 1, 2000`).getMonth();

        // Create the date
        const year = startDate.getFullYear();
        let resultDate = new Date(year, monthIndex, day);

        // If the result date is before the start date, increment the year
        if (resultDate < startDate) {
            resultDate = new Date(year + 1, monthIndex, day);
        }

        return resultDate;
    }

    // Handle dayChar as a day of the week
    const dayIndex = daysOfWeek.indexOf(dayChar);
    if (dayIndex === -1) {
        throw new Error('Invalid day character');
    }

    const resultDate = new Date(startDate);
    const startDayIndex = (resultDate.getDay() + 6) % 7; // Adjusting for Monday as the first day

    // Calculate the difference in days
    const diff = (dayIndex - startDayIndex + 6) % 6;
    if (diff === 0) {
        return resultDate; // The start date is the same as the target day
    }

    // Add the difference in days to the start date
    resultDate.setDate(resultDate.getDate() + diff);
    return resultDate;
}
function dateToICSArrayWithTime(date: Date, time: string): number[] {
    const hours = parseInt(time.slice(0, 2), 10);
    const minutes = parseInt(time.slice(2, 4), 10);
    return [
        date.getFullYear(),
        date.getMonth() + 1, // Months are 0-based in JavaScript
        date.getDate(),
        hours,
        minutes,
        0 // Assuming seconds are 0 since they are not provided
    ];
}
function formatDateToICS(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
function createICSFile(events: { title: string; start: number[]; end: number[]; recurrenceRule: string; }[] | ics.EventAttributes[]): Promise<string> {
    return new Promise((resolve, reject) => {
        // Convert events array to ICS format
        // @ts-expect-error will figure this out later lol
        createEvents(events, (error, value) => {
            if (error) {
                reject(error);
                return;
            }

            // Create a Blob with the ICS data
            const blob = new Blob([value], { type: 'text/calendar' });

            // Generate a URL for the Blob
            const url = URL.createObjectURL(blob);
            resolve(url);
        });
    });
}