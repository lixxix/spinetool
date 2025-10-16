import "@/components/unit/loading.css";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { LoadingContext } from "./loading_provider";

function Loading() {
    const { show, info} = useContext(LoadingContext);
    return (
        <>
            {/* <LoadingContext.Provider value={{ show_loading: SetShow, hide: Hide }}> */}
            <div className={cn("aaaaa gap-2", show ? "" : "invisible")}>
                <div className="loading">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p>{info}</p>
                {/* {progress != 0 && <Progress className="h-2 w-[300px]" value={progress}></Progress>} */}
            </div>
        </>
    )
}

export default Loading;