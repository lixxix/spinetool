import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  set_restore_dir,
  set_restore_files,
  set_restore_taskid,
  update_restore_files,
} from "@/slice/restoreSlice";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RestoreDetail, RestoreUpdate } from "./type";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

import { LoadingContext } from "./unit/loading_provider";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function RestoreView() {
  const restore_dir = useAppSelector(
    (state: RootState) => state.restore.file_dir
  );
  const restore_files = useAppSelector(
    (state: RootState) => state.restore.restore_files
  );
  const taskid = useAppSelector((state: RootState) => state.restore.taskid);
  const [stoping, setStoping] = useState(false);
  const [need_tidy, setNeedTidy] = useState(false);
  // const [preview, setPreview] = useState("");

  const loading = useContext(LoadingContext);

  const dispatch = useAppDispatch();
  const scrollableRef = useRef<HTMLDivElement>(null);

  let unlistenFn: any = null;
  let unlistenEvent: any = null;
  let unlistenUpdate: any = null;

  useEffect(() => {
    if (taskid != 0) {
      listen("restore_finish", (event: any) => {
        if (taskid == event.payload) {
          dispatch(set_restore_taskid(0));
        
          setStoping(false);
        }
        console.log("export finished", event, taskid);
      }).then((ulisten) => {
        unlistenFn = ulisten;
      });

      listen("restore_detail", (event: any) => {
        let detail_data: RestoreUpdate = event.payload as RestoreUpdate;
        dispatch(update_restore_files(detail_data));
        if (scrollableRef && detail_data.ready) {
          console.log("taskid", detail_data);
          let id_ement = document.getElementById(detail_data.id.toString());
          scrollableRef.current?.scrollTo({
            top: id_ement?.offsetTop,
            behavior: "smooth",
          });
        }
      }).then((ulisten) => {
        unlistenEvent = ulisten;
      });
    }

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
      if (unlistenEvent) {
        unlistenEvent();
      }
      if (unlistenUpdate) {
        unlistenUpdate();
      }
    };
  }, [taskid]);

  async function BrowserSpineRoot() {
    const select = await open({
      directory: true,
      multiple: false,
    });

    if (select) {
      dispatch(set_restore_dir(select as string));
      try {
        loading?.setShow(true);
        loading?.setInfo("正在解析数据...");
        let restore_file = (await invoke("get_restore_files", {
          dir: select,
        })) as RestoreDetail[];
        // console.log("restore file: ", restore_file);
        setNeedTidy(false);
        for (let i = 0; i < restore_file.length; i++) {
          if (restore_file[i].tidy_dir) {
            setNeedTidy(true);
            break;
          }
        }

        dispatch(set_restore_files(restore_file as RestoreDetail[]));
        loading?.setShow(false);
      } catch (err) {
        toast(err as string);
      }
    }
  }

  async function StartRestore() {
    if (taskid == 0) {
      try {
        let taskid: number = await invoke("start_restore_spine", {
          spines: restore_files,
        });
     
        dispatch(set_restore_taskid(taskid));
      } catch (err) {
        toast(err as string);
      }
    } else {
      try {
        await invoke("stop_restore_spine", { taskid: taskid });
      
        setStoping(true);
      } catch (err) {
        toast(err as string);
      }
    }
  }

  async function TidyFiles() {
    let tidy_files = [];
    for (let i = 0; i < restore_files.length; i++) {
      if (restore_files[i].tidy_dir) {
        tidy_files.push(restore_files[i]);
      }
    }
    console.log(tidy_files, "需要整理的数据");
    try {
      loading?.setShow(true);
      loading?.setInfo("正在整理数据...");
      await invoke("tidy_files", { files: tidy_files });
    
      try {
        loading?.setShow(true);
        loading?.setInfo("正在解析数据...");
        let restore_file = (await invoke("get_restore_files", {
          dir: restore_dir,
        })) as RestoreDetail[];
 
        setNeedTidy(false);
        for (let i = 0; i < restore_file.length; i++) {
          if (restore_file[i].tidy_dir) {
            setNeedTidy(true);
            break;
          }
        }

        dispatch(set_restore_files(restore_file as RestoreDetail[]));
        loading?.setShow(false);
      } catch (err) {
        toast(err as string);
      }
    } catch (err) {
      toast(err as string);
    } finally {
      loading?.setShow(false);
    }
  }

  // function OpenSubWindow(): Promise<void> {
  //   return new Promise<void>((resolve, _) => {
  //     const webview = new WebviewWindow("spineview", {
  //       url: "/spineview",
  //       title: "动画展示",
  //       center: true,
  //       minWidth: 800,
  //       minHeight: 600,
  //       decorations: true,
  //     });

  //     webview.once("tauri://created", function () {
  //       console.log("新窗口启动");
  //       setTimeout(() => {
  //         resolve();
  //       }, 1000);
  //     });
  //   });
  // }

  // const { setSpineFile, setShowSpine } = useContext(DialogSpineContext);
  // async function OnCheckAnimation(spine_file: RestoreDetail) {
  // 先将文件拷贝到对应的位置，然后传递相对的文件路径。
  // try {
  //   let fileData: string = await invoke("copy_tmp_file", {
  //     details: spine_file,
  //   });
  //   console.log("File data:", fileData);

  //   let windows = await getAll();
  //   let exists = false;

  //   windows.forEach((label) => {
  //     if (label.label == "spineview") exists = true;
  //   });

  //   if (!exists) {
  //     console.log("opening spine");
  //     await OpenSubWindow();
  //     console.log("opened spine");
  //   }
  //   emit("child-window-event", { data: fileData });
  //   let name = spine_file.atlas.split("\\").pop() as string;
  //   dispatch(set_animation_version({ name, version: spine_file.version }));
  // } catch (err) {
  //   toast.error(err as string, {
  //     description: "请先启动web服务",
  //   });
  // }
  // }

  return (
    <>
      <div className="flex flex-col gap-2 text-sm">
        <Card className="flex flex-col gap-1.5 p-2">
          <div className="grid grid-cols-12 w-full items-center gap-2">
            <p className="col-span-2 self-right text-right">Spine文件夹:</p>
            <Input
              type="text"
              value={restore_dir}
              disabled
              className="col-span-8"
              placeholder="请输入spine文件夹路径"
            />
            <Button
              type="submit"
              onClick={BrowserSpineRoot}
              className="col-span-2"
            >
              浏览
            </Button>
          </div>
        </Card>
        <Card
          ref={scrollableRef}
          className="h-[calc(100vh-200px)] overflow-auto whitespace-nowrap"
        >
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="text-center w-[40px]">查看</TableHead> */}
                <TableHead>纹理路径</TableHead>
                <TableHead className="text-center w-[60px]">还原比例</TableHead>
                <TableHead className="text-center w-[60px]">版本</TableHead>
                <TableHead className="text-center w-[200px]">状态</TableHead>
                <TableHead className="text-center w-[100px]">整理</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restore_files.map((data) => (
                <TableRow
                  key={data.atlas}
                  id={data.id.toString()}
                  // className={preview == data.atlas ? "bg-blue-200 hover:bg-blue-300" : ""}
                >
                  <TableCell className="font-medium">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {data.atlas.length < 40
                              ? data.atlas
                              : "..." +
                                data.atlas.slice(
                                  data.atlas.length - 37,
                                  data.atlas.length
                                )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{data.atlas}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">{data.scale}</TableCell>
                  <TableCell className="text-center">{data.version}</TableCell>
                  <TableCell className="text-center">
                    <div className="w-[200px] overflow-hidden">{data.desc}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {data.tidy_dir ? "可以" : "无需"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="flex flex-row justify-end gap-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  className="w-[100px]"
                  disabled={!need_tidy}
                  onClick={TidyFiles}
                >
                  整理目录
                </Button>
              </TooltipTrigger>
              <TooltipContent className="whitespace-pre">
                将spine导出文件匹配到单独的文件夹中
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* <Button onClick={OnScan}>重新扫描</Button> */}
          <Button
            className="w-[100px]"
            disabled={stoping}
            onClick={StartRestore}
          >
            {taskid != 0 ? "停止" : "还原"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default RestoreView;
