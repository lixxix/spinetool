import { ReactNode, createContext,  useState } from "react"

export interface ProviderDialogSpine {
    spineFile : string;
    setSpineFile : React.Dispatch<React.SetStateAction<string>>;
    showSpine : boolean;
    setShowSpine: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DialogSpineContext = createContext<ProviderDialogSpine>(null!);

function DialogSpineProvider(props:{children : ReactNode}) {

    const [spineFile, setSpineFile] = useState("");
    const [showSpine , setShowSpine] = useState(false);
    return (
        <DialogSpineContext.Provider value={{ spineFile, setSpineFile, showSpine, setShowSpine }}>
            {props.children}
        </DialogSpineContext.Provider>
    )
}

export default DialogSpineProvider;