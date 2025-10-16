import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { set_split_dir, set_split_files, set_split_output, set_split_task, update_split_file } from "@/slice/splitSlice";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { invoke } from "@tauri-apps/api";
import { open } from '@tauri-apps/api/dialog';
import { listen } from "@tauri-apps/api/event";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SplitDetail, SplitUpdate } from "./type";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingContext } from "./unit/loading_provider";

function SplitView() {

    const split_dir = useAppSelector((state: RootState) => state.split.dir)
    const split_files = useAppSelector((state: RootState) => state.split.atlas);
    const taskid = useAppSelector((state: RootState) => state.split.taskid);
    const split_out = useAppSelector((state: RootState) => state.split.split_out_root);
    const dispatch = useAppDispatch()
    const scrollableRef = useRef<HTMLDivElement>(null);
    const loading = useContext(LoadingContext)
    const [ratio_select, setRatioSelect] = useState("./images");

    let unlistenFinish: any = null;
    let unlistenDetail: any = null;

    useEffect(() => {
        if (taskid != 0) {
            listen("split_finish", (event: any) => {
                if (taskid == event.payload) {
                    dispatch(set_split_task(0));
                  
                }
            }).then((ulisten) => {
                unlistenFinish = ulisten;
            })

            listen("split_detail", (event: any) => {
                let update = event.payload as SplitUpdate;
                dispatch(update_split_file(update));
                if (scrollableRef && update.splited) {
                    let id_ement = document.getElementById(update.id.toString())
                    scrollableRef.current?.scrollTo({
                        top: id_ement?.offsetTop,
                        behavior: "smooth",
                    });
                }
            }).then((ulisten) => {
                unlistenDetail = ulisten;
            })
        }

        return () => {
            if (unlistenFinish) {
                unlistenFinish();
            }

            if (unlistenDetail) {
                unlistenDetail();
            }
        }
    }, [taskid]);

    async function BrowserSplitRoot() {
        const select = await open({
            directory: true,
            multiple: false,
        });

        loading?.setShow(true)
        loading?.setInfo("正在解析文件中..")
        invoke("set_split_dir", { root: select }).then(data => {
            dispatch(set_split_dir(select as string))
            dispatch(set_split_files(data as SplitDetail[]));
        }).catch(err => {
            console.error(err);
        })
        loading?.setShow(false);
    }

    async function startSplit() {

        let outdir = "images"
        if (ratio_select == "other") {
            outdir = split_out;
        }
        console.log(taskid, "starting split", split_out, ratio_select)
        if (taskid == 0) {
            console.log(taskid, "starting");
            invoke("start_split_files", { atlas: split_files, outdir }).then((task) => {
                dispatch(set_split_task(task as number));
            
            }).catch(err => {
                toast.error(err as string, {
                    description: "请提前设置Spine路径",
                })
                dispatch(set_split_task(0));
            })
        } else {
            invoke("stop_split_files", { taskid: taskid }).then((task) => {
                console.log("stop", task);
            }).catch(err => {
                toast.error(err as string);
            });
        }
    }

    async function setSplitOutDir(e: any) {
        dispatch(set_split_output(e.target.value));
    }

    return (
        <div className="flex flex-col gap-2 text-sm">
            <Card className="flex flex-col gap-1.5 p-2" >
                <div className="grid grid-cols-12 w-full items-center gap-2">
                    <p className="col-span-2 self-right text-right">裁剪文件夹:</p>
                    <Input disabled value={split_dir} onChange={e => dispatch(set_split_dir(e.target.value))} type="text" className="col-span-8" placeholder="请输入spine文件夹路径" />
                    <Button type="submit" className="col-span-2" onClick={BrowserSplitRoot}>浏览</Button>
                </div>

                <div className="grid grid-cols-12 gap-2">
                    <RadioGroup value={ratio_select} onValueChange={setRatioSelect} defaultValue="other" className="h-10 col-span-9 col-start-2 grid grid-cols-3">
                        <div className="col-span-1 items-center space-x-2 flex">
                            <RadioGroupItem value="./images" id="images" />
                            <Label htmlFor="images">./images</Label>
                        </div>
                        <div className="col-span-1 items-center space-x-2 flex">
                            <RadioGroupItem value="other" id="other" />
                            <Input value={split_out} onChange={setSplitOutDir} placeholder="自定义相对路径"></Input>
                        </div>
                    </RadioGroup>
                    <Button className="col-span-2" onClick={() => startSplit()}>
                        {taskid != 0 ? "停止" : "裁剪"}
                    </Button>
                </div>
            </Card>
            <Card ref={scrollableRef} className="h-[calc(100vh-200px)] overflow-auto whitespace-nowrap">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>文件名</TableHead>
                            <TableHead className="text-center w-[100px]">裁剪</TableHead>
                            <TableHead className="text-center w-[200px]">描述</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {split_files.map(data => (
                            <TableRow className="font-medium" key={data.atlas} id={data.id.toString()}>
                                <TableCell>
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    {data.atlas.length < 50 ? data.atlas : "..." + data.atlas.slice(data.atlas.length - 47, data.atlas.length)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{data.atlas}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-center">{data.splited ? "已处理" : "待处理"}</TableCell>
                                <TableCell className="text-center">
                                    <div className="w-[200px] overflow-hidden">
                                        {data.desc}
                                    </div>
                                </TableCell>
                            </TableRow>)
                        )}
                    </TableBody>
                </Table>
            </Card>
            {/* <div className="flex flex-row justify-end gap-2">
                
            </div> */}
        </div>
    )
}

export default SplitView;