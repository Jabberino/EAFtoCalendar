import {useDropzone} from "react-dropzone";
import { createICS, extractClassesFromPDF, extractYearTermFromPDF} from "./functions.ts";
import {useEffect, useState} from "react";


export default function App() {
    // const [uploadedFile, setUploadedFile] = useState()
    const [error, setError] = useState('');

    function fileValidator(file: File) {
        if (file.type !== "application/pdf") {
            setError("File must be a PDF");
            return {
                code: "not-pdf",
                message: "File must be a pdf"
            }
        }
        return null
    }
    const {
        getRootProps,
        getInputProps,
        // isDragActive,
        acceptedFiles,
        fileRejections
    } = useDropzone({
        maxFiles: 1,
        validator: fileValidator,
    })

    useEffect(() => {
        if(fileRejections.length > 0){
            setError("Only 1 file expected, you uploaded " + fileRejections.length );
        }
        else{
            setError("");
        }
    }, [fileRejections]);



    if(acceptedFiles.length > 0) {
        // extractClassesFromPDF(URL.createObjectURL(acceptedFiles[0])).then(
        //     formatted =>{
        //         createICS(formatted);
        //     });
        extractYearTermFromPDF(URL.createObjectURL(acceptedFiles[0])).then(({ay, term}) => {
            console.log(ay, term);
        });
    }

    return (
        <div className="flex flex-col">
            <div className="flex flex-col justify-end pt-48 pb-8 border">
                <h1 className="text-center font-bold text-darkgreen text-8xl">EAFToCalendar</h1>
                <h2 className="text-center font-medium text-2xl">Extract your daily class schedule from your EAF</h2>
                <h3 className="text-center font-normal italic ">Runs on the browser, so your data never leaves the device.</h3>
                <div className="flex justify-center  items-center space-x-3">
                    <img src="/appleCalendar.png" className="w-16 h-16" alt="Apple calendar icon"/>
                    <img src="/googleCalendar.png" className="w-14 h-14" alt="Google calendar icon"/>
                </div>
                <div className="flex flex-grow border rounded-3xl items-center self-center p-3 pl-4 pr-4 mt-8 bg-white drop-shadow-md"
                     {...getRootProps()}
                >
                    <input {...getInputProps()} />
                    <img src="/uploadIcon.svg" className="w-12 h-9 " alt="Google calendar icon"/>
                    <p className="text-xl font-medium">
                        {acceptedFiles.length > 0 ? acceptedFiles[0].name : "Upload EAF"}
                    </p>
                </div>
                {error ?
                    <h3 className="text-center mt-2 text-red-400">{error}</h3>
                    :
                    <div className="mt-2 invisible">placeholder</div>
                }
            </div>
            <div>
                after uploading
            </div>
        </div>

    )
}

