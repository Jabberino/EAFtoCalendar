import {useDropzone} from "react-dropzone";
import {useCallback, useState} from "react";
import Upload from "./Upload.tsx";
import {createICS, extractClassesFromPDF, extractYearTermFromPDF, termIsSupported} from "./functions.ts";
import {schedule} from "./interfaces.ts";


export default function App() {
    const [acceptedFile, setAcceptedFile] = useState<null | File>(null)
    const [termDetails, setTermDetails] = useState<{ay: number, term: number} | undefined>()
    const [downloadLink, setDownloadLink] = useState("")
    const [error, setError] = useState('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        let newError = "";
        let newFile = null;
        let newDownloadLink = "";

        if (acceptedFiles.length > 1) {
            newError = "Only 1 file expected, you uploaded " + acceptedFiles.length;
        } else if (acceptedFiles[0].type !== "application/pdf") {
            newError = "EAF must be in PDF form";
        } else { // is a single PDF
            try {
                const res = await extractYearTermFromPDF(URL.createObjectURL(acceptedFiles[0]));
                if (!res) {
                    newError = "Something unexpected went wrong";
                }
                else{
                    setTermDetails(res);
                    const res2 = await termIsSupported(res);

                    if(!res2){
                        newError = `AY ${res.ay}, Term ${res.term} is not supported`;
                    }
                    else{
                        newFile = acceptedFiles[0];
                        // for now, this will just put a download button
                        let schedule: schedule = {
                            classes: undefined,
                            ay: res.ay,
                            term: res.term,
                            start: new Date(res2.start),
                            end: new Date(res2.end),
                        }
                        schedule = await extractClassesFromPDF(URL.createObjectURL(acceptedFiles[0]),schedule);
                        try{
                            newDownloadLink = await createICS(schedule);
                        }catch(error){
                            if(error instanceof Error){
                                newError = error.message;
                            }
                            else{
                                console.error("This shouldn't happen");
                            }
                        }
                    }
                }
            } catch (error) {
                if (error instanceof Error) {
                    newError = error.message;
                } else {
                    console.error("This shouldn't happen");
                }
            }
        }
        if(newError !== error){
            setError(newError);
        }
        if(newFile !== acceptedFile){
            setAcceptedFile(newFile);
        }
        if(newDownloadLink !== downloadLink){
            setDownloadLink(newDownloadLink);
        }

    }, [acceptedFile, downloadLink, error])

    const {
        getRootProps,
        getInputProps,
    } = useDropzone({onDrop})


    return (
        <div className="flex flex-col">
            <Upload acceptedFile={acceptedFile} error={error} getInputProps={getInputProps}
                    getRootProps={getRootProps}/>
            {acceptedFile && downloadLink && termDetails &&
                // <div className="flex justify-center w-1/2 min-h-96 self-center border rounded-md drop-shadow-lg bg-white mb-24">
                //     {}
                // </div>
                <a href={downloadLink} download={`Schedule-AY${termDetails.ay}-T${termDetails.term}.ics`}
                   className="flex flex-grow border self-center bg-darkgreen rounded-lg p-2 sm:p-3 px-4 sm:px-7 text-white text-sm sm:text-xl text-center drop-shadow-lg">Download</a>
            }
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white text-center p-2"> For any bugs (or internships 🙂),
                email me: <a href="mailto:darlito_guamos@dlsu.edu.ph" className="underline">darlito_guamos@dlsu.edu.ph</a>
                {" "} or create a ticket on the <a href="https://github.com/Jabberino/EAFtoCalendar" className="underline" target="_blank">repository</a>.
            </div>
        </div>

    )
}

