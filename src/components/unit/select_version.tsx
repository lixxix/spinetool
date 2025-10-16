import { RootState } from "@/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";



const SelectVersion = (props: { className?: string , version : string, setVersion : Function}) => {

    const versions = useSelector((state: RootState) => state.spine.version);
    
    function OnChangeVersion(e: string) {
        console.log("change version",e);
        props.setVersion(e);
    }

    useEffect(() => {
        console.log("version: " + versions);
    }, [])

    return (
        <>
            <Select value={props.version} onValueChange={OnChangeVersion}>
                <SelectTrigger className={cn(props.className)}>
                    <SelectValue placeholder="选择版本" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>选择你的版本</SelectLabel>
                        {
                            versions.map((vv) => (
                                <SelectItem key={vv} value={vv}>{vv}</SelectItem>
                            ))
                        }
                    </SelectGroup>
                </SelectContent>
            </Select>
        </>
    )
}


export default SelectVersion;