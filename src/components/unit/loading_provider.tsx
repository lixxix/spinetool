import { createContext, useState } from "react";


export interface LoadingState {
    show: boolean;
    setShow: Function;
    info: string;
    setInfo: React.Dispatch<React.SetStateAction<string>>;
}

export const LoadingContext = createContext<LoadingState>(null!);

type LoadingProviderProps = {
    children: any;
}

function LoadingProvider(props: LoadingProviderProps) {

    const [show, setShow] = useState(false);
    const [info, setInfo] = useState("");
   
    return (
        <LoadingContext.Provider value={{ show, setShow, info, setInfo }}>
            {props.children}
        </LoadingContext.Provider>
    )
}

export default LoadingProvider;