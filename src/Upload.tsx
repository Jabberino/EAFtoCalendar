import {DropzoneInputProps, DropzoneRootProps} from "react-dropzone";

interface UploadInterface {
    getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
    getInputProps:  <T extends DropzoneInputProps>(props?: T) => T;
    acceptedFile: File | null;
    error: string;
}

export default function Upload({getRootProps, getInputProps, acceptedFile, error}: UploadInterface) {

    return (
        <div className="flex flex-col justify-end pt-48 pb-8">
            <h1 className="text-center font-bold text-darkgreen text-4xl sm:text-8xl">EAFToCalendar</h1>
            <h2 className="text-center font-medium text-sm sm:text-2xl">Extract your daily class schedule from your EAF</h2>
            <h3 className="text-center font-normal text-xs sm:text-sm  italic ">Runs on the browser, so your data never leaves the
                device.</h3>
            <div className="flex justify-center pt-3 items-center space-x-3">
                <img src="/appleCalendar.png" className="sm:w-16 sm:h-16 w-10 h-10" alt="Apple calendar icon"/>
                <img src="/googleCalendar.png" className="sm:w-16 sm:h-16 w-10 h-10" alt="Google calendar icon"/>
            </div>
            <div
                className="flex flex-grow border rounded-3xl items-center self-center p-2 sm:p-3 pl-2 sm:pl-4 pr-3 sm:pr-4 mt-4 sm:mt-8 bg-white drop-shadow-md"
                {...getRootProps()}
            >
                <input {...getInputProps()} />
                <img src="/uploadIcon.svg" className="sm:w-12 sm:h-9 w-8 h-6" alt="Google calendar icon"/>
                <p className="text-xs sm:text-xl font-medium">
                    {acceptedFile ? acceptedFile.name : "Upload EAF"}
                </p>
            </div>
            {error ?
                <h3 className="text-center mt-2 text-red-400">{error}</h3>
                :
                <div className="mt-2 invisible">placeholder</div>
            }
        </div>
    )
}