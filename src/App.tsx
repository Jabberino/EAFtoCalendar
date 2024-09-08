import {useDropzone} from "react-dropzone";
import {createICS, extractTextFromPDF} from "./functions.ts";


export default function App() {


    // const onDrop = useCallback((acceptedFiles: File[]) => {
    //     console.log(typeof acceptedFiles);
    //     console.log(acceptedFiles);
    //     // Do something with the files
    // }, [])


    function fileValidator(file: File) {
        if (file.type !== "application/pdf") {
            console.log("rejected here:");
            console.log(file.name);
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
    console.log("accepted:" + acceptedFiles);
    console.log("rejected:" + fileRejections);

    if(acceptedFiles.length > 0) {
        extractTextFromPDF(URL.createObjectURL(acceptedFiles[0])).then(
            formatted =>{
                createICS(formatted);
            });
    }


    return (
        <>
            <div className="border-8 border-orange-800">
                File Uploaded:
                {acceptedFiles && acceptedFiles.length > 0 ? acceptedFiles[0].name : "nothing"}

            </div>
            <div {...getRootProps()} className="fixed top-0 left-0 w-screen h-screen">
                <input {...getInputProps()} />
                    TEST
            </div>
        </>

    )
}

