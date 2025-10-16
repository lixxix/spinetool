import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";


export default function GlobalProgress() {

    const [progress, setProgress] = useState(0);

    let unlistenFn: any = null;

    useEffect(() => {
        listen("progress", (event: any) => {
console.log("progreess", event.payload)
            setProgress(event.payload);
        }).then(ulisten => {
            unlistenFn = ulisten;
        })

        return () => {
            if (unlistenFn) unlistenFn();
        }
    }, []);

    return (
        (progress != 0 && progress != 100) && (<div className="fixed bottom-0 left-0 right-0 h-2.5">
            <progress className="w-full h-3.5" value={progress} max={100} />
        </div>)
    )
}