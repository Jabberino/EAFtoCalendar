import {useDropzone} from "react-dropzone";
import {useCallback, useState} from "react";
import Upload from "./Upload.tsx";
import {extractYearTermFromPDF, termIsSupported} from "./functions.ts";


export default function App() {
    const [acceptedFile, setAcceptedFile] = useState<null | File>(null)
    const [error, setError] = useState('');


    let ay: number, term: number;

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        let newError = "";
        let newFile = null;

        if (acceptedFiles.length > 1) {
            newError = "Only 1 file expected, you uploaded " + acceptedFiles.length;
        } else if (acceptedFiles[0].type !== "application/pdf") {
            newError = "EAF must be in PDF form";
        } else { // is a single PDF
            let res;
            try {
                res = await extractYearTermFromPDF(URL.createObjectURL(acceptedFiles[0]));
                if (!res) {
                    newError = "Something unexpected went wrong";
                }
                // @ts-expect-error above conditional catches null
                if(await termIsSupported(res)){
                    newFile = acceptedFiles[0];
                }
                else{
                    // @ts-expect-error conditional catches null
                    newError = `AY ${res.ay}, Term ${res.term} is not supported`;
                }
            } catch (error) {
                if (error instanceof Error) {
                    newError = error.message;
                } else {
                    console.error("This shouldn't happen");
                }
            }


        }
        setError(newError);
        setAcceptedFile(newFile);

    }, [])

    const {
        getRootProps,
        getInputProps,
    } = useDropzone({onDrop})



    return (
        <div className="flex flex-col">
            <Upload  acceptedFile={acceptedFile} error={error} getInputProps={getInputProps} getRootProps={getRootProps}/>
            {acceptedFile &&
                <div className="flex justify-center w-1/2 min-h-96 self-center border rounded-md drop-shadow-lg bg-white mb-24">
                    {}
                </div>
            }

        </div>

    )
}

