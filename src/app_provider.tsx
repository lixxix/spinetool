import { VSize } from "./components/type";
import React, { useState, createContext } from "react";

export interface AppState {
    size: VSize;
    setSize: React.Dispatch<React.SetStateAction<VSize>>;
}


export const AppContext = createContext<AppState>(null!);

type AppProviderProps = {
    children: any;
}

function AppProvider(props: AppProviderProps) {

    const [size, setSize] = useState<VSize>({width:400, height:400})
    return (
        <AppContext.Provider value={{ size, setSize }}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppProvider;