import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
import React from "react";

function ToolButton(props: { children:string | undefined; className?: string | undefined, tip: string, onClick: React.MouseEventHandler | undefined}) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className={props.className} onClick={props.onClick}>
                        {props.children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{props.tip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}


export default ToolButton;