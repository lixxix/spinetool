import { RootState } from "@/store";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useAppSelector } from "@/store/hook";


const SelectExport = (props: { className?: string , selectType : string , setSelectType: Function}) => {
    const types = useAppSelector((state: RootState) => state.setting.export_types)

    useEffect(()=> {    
      
    },[])

    function OnChangeType(e : string) {
        props.setSelectType(e);
    }

    return (
    <>
            <Select value={props.selectType} onValueChange={OnChangeType} >
                <SelectTrigger className={cn(props.className)}>
                    <SelectValue placeholder="选择导出" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>选择你的版本</SelectLabel>
                        {
                            types.map((vv) => (
                                <SelectItem key={vv} value={vv}>{vv}</SelectItem>
                            ))
                        }
                    </SelectGroup>
                </SelectContent>
            </Select>
        </>
    )
}
export default SelectExport;