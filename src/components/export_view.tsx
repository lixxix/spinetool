import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { open } from '@tauri-apps/api/dialog';
import { useEffect, useMemo, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { set_export_dir, set_export_files, set_export_relative_dir, set_export_root_type, set_export_spine_dir, set_export_taskid, set_export_type, set_export_version, update_export_files } from "@/slice/exportSlice";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { SelectTrigger } from "@radix-ui/react-select";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, exists, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";
import { toast } from "sonner";
import { ExportDetail, SpineFile } from "./type";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectValue } from "./ui/select";
import SelectExport from "./unit/select_export";
import SelectVersion from "./unit/select_version";

function SpineExportView() {
 
    const spine_files = useAppSelector((state: RootState) => state.export.files)
    const spine_dir = useAppSelector((state: RootState) => state.export.spine_dir)
    const export_dir = useAppSelector((state: RootState) => state.export.export_dir)
    const export_relative_dir = useAppSelector((state: RootState) => state.export.export_relative_dir)
    const version = useAppSelector((state: RootState) => state.export.version);
    const taskid = useAppSelector((state: RootState) => state.export.taskid);
    const select_type = useAppSelector((state: RootState) => state.export.select_type);
    const export_set = useAppSelector((state: RootState) => state.setting.export_setting);

    const export_type = useAppSelector((state: RootState)=> state.export.export_root_type);

    const dispatch = useAppDispatch();
    const scrollableRef = useRef<HTMLDivElement>(null);

    let unlistenFn: any = null;
    let unlistenEvent: any = null;

    const task_files = useMemo(
        () => {
            return spine_files
        }, [spine_files]
    )

    useEffect(() => {
        if (taskid != 0) {
            listen("export_finish", (event: any) => {
                if (taskid == event.payload) {
                    dispatch(set_export_taskid(0));
               
                }
                console.log("export finished", event, taskid);
            }).then((ulisten) => {
                unlistenFn = ulisten;
            })

            listen("export_detail", (event) => {
                console.log("taskid", taskid)
                let detail_data: ExportDetail = event.payload as ExportDetail;
                dispatch(update_export_files(detail_data))
                if (scrollableRef && detail_data.ready) {
                    let id_ement = document.getElementById(detail_data.id.toString())
                    scrollableRef.current?.scrollTo({
                        top: id_ement?.offsetTop,
                        behavior: "smooth",
                    });
                }
            }).then((ulisten) => {
                unlistenEvent = ulisten;
            })
        }

        return () => {
            if (unlistenFn) {
                unlistenFn();
            }
            if (unlistenEvent) {
                unlistenEvent();
            }
        }
    }, [taskid, export_type]);

    async function startExport() {
        if (taskid == 0) {
            if (version === "") {
                toast.warning("请选择导出版本", { description: "您尚未设置导出版本" });
                return;
            }
            if (select_type === "") {
                toast.warning("请选择导出类型", { description: "您尚未选择导出类型" });
                return;
            }

            if (spine_files.length == 0) {
                toast.warning("无处理文件", { description: "需要有待处理的文件" });
                return;
            }
            // console.log(export_type, export_dir)
            if ( export_type=="绝对路径") {
                // 检查是否是有效路径
                if (export_dir == "") {
                    toast.warning("检查导出配置", {description: "请输入导出路径"})
                    return 
                }
            }
            try {
                let res_dir = `export\\${select_type}`;
                console.log(res_dir)
                let ex = await exists(res_dir, { dir: BaseDirectory.AppConfig, append: false });
                if (ex) {
                  
                    let type_path = export_set[select_type][version.slice(0, 3)]
           
                    if (type_path) {
                        let data = await readTextFile(type_path)
                        let obj = JSON.parse(data);
                        console.log(obj);
                        if ((obj.project != undefined || obj.input != undefined) && obj.output != undefined) {
                            // 首先将所有的数据准备好。
                            for (let i = 0; i < spine_files.length; i++) {
                                let target_path: any
                                console.log(spine_files[i])
                                let single = false;
                                if (obj.skeletonType == "single") {
                                    single = true;
                                }

                                let input_dir = spine_files[i].file_path;
                                if (obj.project) {
                                    obj.project = spine_files[i].file_path + "/" + spine_files[i].file_name;
                                    target_path = obj.project;
                                }
                                else {
                                    obj.input = spine_files[i].file_path + "/" + spine_files[i].file_name;
                                    target_path = obj.input;
                                }

                                console.log(export_type, input_dir);
                                if ( export_type!="绝对路径") {
                                    if (single) {
                                        obj.output = input_dir + "/" + export_relative_dir + "/" + spine_files[i].file_name;
                                    } else {
                                        obj.output = input_dir + "/" + export_relative_dir;
                                    }
                                    console.log("相对路径", obj.output)
                                } else {
                                    if (single) {
                                        obj.output = export_dir + "/" + spine_files[i].file_name;
                                    } else {
                                        obj.output = export_dir;
                                    }
                                }

                                let text_string = JSON.stringify(obj);
                                console.log(text_string)
                                try {
                                    await writeTextFile(target_path.replace(".spine", ".export"), text_string);
                                } catch (err) {
                                    console.error(err)
                                }
                            }
                            try {
                                let taskid: number = await invoke("start_exporting_spine", { spines: spine_files, version: version });
                                console.log("接收到的task", taskid);
                                dispatch(set_export_taskid(taskid));
                              
                            } catch (err) {
                                toast.error(err as string, {
                                    description: "请提前设置Spine路径",
                                })
                                dispatch(set_export_taskid(0));
                            }
                        } else {
                            toast.error("问题了", { description: "请检查配置文件，似乎有问题。" })
                        }
                    } else {
                        // 通过新接口获取文件
                        try {
                            let setting_path: string = await invoke("get_export_type", { version: version.slice(0, 3), export: select_type })
                            if (setting_path) {
                                let data = await readTextFile(setting_path)
                                let obj = JSON.parse(data);
                            
                                if ((obj.project != undefined || obj.input != undefined) && obj.output != undefined) {
                                    // 首先将所有的数据准备好。
                                    for (let i = 0; i < spine_files.length; i++) {
                                        let target_path: any
                                        let single = false;

                                        if (obj.skeletonType == "single") {
                                            single = true;
                                        }

                                        let input_dir = spine_files[i].file_path;
                                        if (obj.project) {
                                            obj.project = spine_files[i].file_path + "/" + spine_files[i].file_name;
                                            target_path = obj.project;
                                        }
                                        else {
                                            obj.input = spine_files[i].file_path + "/" + spine_files[i].file_name;
                                            target_path = obj.input;
                                        }
        
                                        console.log(export_type, input_dir);
                                        if ( export_type!="绝对路径") {
                                            if (single) {
                                                obj.output = input_dir + "/" + export_relative_dir + "/" + spine_files[i].file_name;
                                            } else {
                                                obj.output = input_dir;
                                            }
                                            console.log("相对路径", obj.output)
                                        } else {
                                            if (single) {
                                                obj.output = export_dir + "/" + spine_files[i].file_name;
                                            } else {
                                                obj.output = export_dir;
                                            }
                                        }

                                        console.log("output", obj.output);
                                        let text_string = JSON.stringify(obj);
                                        console.log(text_string)
                                        try {
                                            await writeTextFile(target_path.replace(".spine", ".export"), text_string);
                                        } catch (err) {
                                            console.error(err)
                                        }
                                    }
                                    try {
                                        let taskid: number = await invoke("start_exporting_spine", { spines: spine_files, version: version });
                                        dispatch(set_export_taskid(taskid));
                                       
                                    } catch (err) {
                                        toast.error(err as string, {
                                            description: "请提前设置Spine路径",
                                        })
                                        dispatch(set_export_taskid(0));
                                    }
                                } else {
                                    toast.error("问题了", { description: "请检查配置文件，似乎有问题。" })
                                }
                            }
                        } catch (err) {
                            let res_path = await appConfigDir();
                            toast.error("没有找到配置文件", {
                                description: "请在配置文件中新增对应的导出配置",
                                action: {
                                    label: "跳转目录",
                                    onClick: () => {
                                        invoke("open_dir", { dir: res_path + res_dir }).then(() => {
                                            console.log("open dir ", res_dir);
                                        }).catch(err => {
                                            console.error(err);
                                        });
                                    }
                                }
                            });
                        }
                    }
                } else {
                    toast.error("导出配置不存在");
                }
            }
            catch (err) {
                console.error(err);
            }
        } else {
            // 取消导出
            console.log("停止", taskid);
            if (taskid != 0) {
                try {
                    await invoke("stop_exporting_spine", { taskid });
                    dispatch(set_export_taskid(0));
                   
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

    function setVersion(version: string) {
        console.log("set version ", version);
        dispatch(set_export_version(version));
    }

    function setSelectType(typedata: string) {
        console.log("set select type ", typedata);
        dispatch(set_export_type(typedata))
    }

    async function BrowserSpineRoot() {
        const select = await open({
            directory: true,
            multiple: false,
        });
        if (select) {
            dispatch(set_export_spine_dir(select as string))
            invoke("get_spine_files", { root: select }).then(data => {
                dispatch(set_export_files(data as SpineFile[]));
            }).catch(err => {
                console.error(err);
            })
        }
    }

    async function BrowserExportRoot() {
        const select = await open({
            directory: true,
            multiple: false,
        });
        dispatch(set_export_dir(select as string))
    }

    const OutputTypes = [
        "相对路径",
        "绝对路径"
    ]

    return (
        <div className="space-y-2">
            <Card className="flex flex-col gap-1.5 p-2" >
                <div className="grid grid-cols-12 w-full items-center gap-2">
                    <p className="col-span-2 self-right text-right">Spine文件夹:</p>
                    <Input value={spine_dir} onChange={e => dispatch(set_export_spine_dir(e.target.value))} type="text" className="col-span-8" placeholder="请输入spine文件夹路径" />
                    <Button type="submit" className="col-span-2" onClick={BrowserSpineRoot}>浏览</Button>
                </div>
                <div className="grid grid-cols-12 w-full items-center gap-2 ">
                    <Select  value={export_type} onValueChange={(e:string) => dispatch(set_export_root_type(e))} >
                    <SelectTrigger className=  "col-span-2 self-right text-right" >
                        <SelectValue placeholder="选择导出" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>导出类型</SelectLabel>
                            {
                                OutputTypes.map((vv) => (
                                    <SelectItem key={vv} value={vv}>{vv}</SelectItem>
                                ))
                            }
                        </SelectGroup>
                    </SelectContent>
                </Select>
                    {
                        export_type!="绝对路径" ? 
                        <Input value={export_relative_dir}  onChange={e => dispatch(set_export_relative_dir(e.target.value))} type="text" className="col-span-8" placeholder="输入路径，不填写则是每个spine文件对应的路径" /> :
                        <Input value={export_dir}  disabled={true} onChange={e => dispatch(set_export_dir(e.target.value))} type="text" className="col-span-8" placeholder="点击前面文字可以选择相对和绝对路径" />
                    }
                    {
                        export_type != "绝对路径" ?
                        <Button type="submit" disabled={true} className="col-span-2" onClick={BrowserExportRoot}>浏览</Button> :
                        <Button type="submit" className="col-span-2" onClick={BrowserExportRoot}>浏览</Button>
                    }
                </div>
                <div className="grid grid-cols-12 justify-between gap-2 items-center">
                    <div className="grid grid-cols-4 mx-2 col-span-4 items-center">
                        <p className="col-span-2 text-right mr-2">spine版本</p>
                        <SelectVersion className="w-[100px]" version={version} setVersion={setVersion}></SelectVersion>
                    </div>
                    <div className="col-span-4 mx-2 grid grid-cols-4 items-center">
                        <p className="col-span-2 text-right mr-2">导出类型</p>
                        <SelectExport selectType={select_type} setSelectType={setSelectType} className="w-[200px]"></SelectExport>
                    </div>
                    <Button className="col-span-2 col-start-11" onClick={() => startExport()}>
                        {taskid != 0 ? "停止" : "导出"}
                    </Button>
                </div>
            </Card>
            <Card ref={scrollableRef} className="h-[calc(100vh-230px)] overflow-auto whitespace-nowrap">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">文件名</TableHead>
                            <TableHead>文件路径</TableHead>
                            <TableHead className="text-center w-[200px]">状态</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {task_files.map(data => (
                            <TableRow key={data.file_path + "/" + data.file_name} id={data.id.toString()}>
                                <TableCell className="font-medium">{data.file_name}</TableCell>
                                <TableCell>
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    {data.file_path.length < 40 ? data.file_path : "..." + data.file_path.slice(data.file_path.length - 37, data.file_path.length)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{data.file_path}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
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
        </div>
    )
}

export default SpineExportView;