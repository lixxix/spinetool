import { invoke } from "@tauri-apps/api";
import { Button } from "./ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { RootState } from "@/store";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import ToolButton from "./unit/tooltip_button";
import { open } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import {
  BaseDirectory,
  FileEntry,
  createDir,
  readDir,
} from "@tauri-apps/api/fs";
import { toast } from "sonner";
import {
  set_export_setting,
  set_export_types,
  set_spine_root,
} from "@/slice/settingSlice";
import { appConfigDir } from "@tauri-apps/api/path";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function SettingView() {
  const spine_root = useAppSelector(
    (state: RootState) => state.setting.exec_root
  );
  const temp_root = useAppSelector(
    (state: RootState) => state.setting.temp_root
  );
  const export_types = useAppSelector(
    (state: RootState) => state.setting.export_types
  );
  const dispatch = useAppDispatch();

  const [root, setRoot] = useState(spine_root);
  const [tempRoot, setTempRoot] = useState(temp_root);
  const [openAsk, setOpenAsk] = useState(false);
  const [newDir, setNewDir] = useState("");
  // const [servering, setServering] = useState(false);

  useEffect(() => {
    setRoot(spine_root);
  }, [spine_root]);

  async function OnSave() {
    // 判断是否合理
    const entries = await readDir(root, { recursive: false });
    let right = false;
    entries.forEach((entry: FileEntry) => {
      if (right) {
        return;
      }
      if (entry.name?.startsWith("Spine")) {
        right = true;
      }
    });
    console.log(right);
    if (right == false) {
      toast.warning("您设置的spine目录没有找到Spine文件。");
    } else {
      toast.success("设置成功！", {
        description: "您可以正常使用导出和还原功能！",
      });
      try {
        await invoke("set_setting", { root: root, temp: tempRoot });
        dispatch(set_spine_root(root));
      } catch (err) {
        toast.error(err as string);
      }
    }
  }

  async function SetSpineRoot() {
    const select = await open({
      directory: true,
      multiple: false,
    });

    setRoot(select as string);
  }

  async function SetTempRoot() {
    const select = await open({
      directory: true,
      multiple: false,
    });

    setTempRoot(select as string);
  }

  async function DeletDir(tp_dir: string) {
    try {
      let dir = await appConfigDir();
      dir = dir + "export\\" + tp_dir;
      await invoke("delete_dir", { dir: tp_dir });

      await invoke("delete_dir", { dir });
    } catch (err) {
      toast.error(err as string);
    }
  }

  async function OpenDir(tp_dir: string) {
    try {
      let dir = await appConfigDir();
      dir = dir + "export\\" + tp_dir;
      console.log(dir);

      await invoke("open_dir", { dir });
    } catch (err) {
      toast.error(err as string);
    }
  }

  function OnChangeInput(value: any) {
    console.log(value);
    setRoot(value.target.value);
  }

  function OpenAsk() {
    setOpenAsk(true);
  }

  async function AddDir() {
    console.log("new dir", newDir);
    try {
      await createDir(`export\\${newDir}`, { dir: BaseDirectory.AppConfig });
      toast.success("成功创建目录");
      invoke("get_export_data").then((data: any) => {
        let map: { [key: string]: { [key: string]: string } } = data.map;
        let types = Object.keys(map);
        dispatch(set_export_types(types));
        dispatch(set_export_setting(data.map));
      });
    } catch (err) {
      toast.error(err as string);
    }
  }

  return (
    <>
      <div>
        <Card className="mb-2 py-2 px-1 flex flex-col gap-1">
          <div className=" grid grid-cols-6 gap-2 items-center px-1">
            <p className="text-md col-span-1 text-right">Spine目录:</p>
            <Input
              className="col-span-4 h-9"
              value={root}
              onChange={OnChangeInput}
              placeholder="Spine执行目录"
            ></Input>
            <ToolButton
              className="col-span-1"
              onClick={SetSpineRoot}
              tip="设置后请点击保存按钮"
            >
              设置
            </ToolButton>
          </div>
          <div className=" grid grid-cols-6 gap-2 items-center px-1">
            <p className="text-md col-span-1 text-right">临时目录:</p>
            <Input
              className="col-span-4 h-9"
              value={tempRoot}
              onChange={(e) => setTempRoot(e as any)}
              placeholder="临时文件目录"
            ></Input>
            <ToolButton
              className="col-span-1"
              onClick={SetTempRoot}
              tip="临时文件保存目录（浏览spine需要）"
            >
              设置
            </ToolButton>
          </div>
        </Card>

        <Card className="p-1 flex flex-col gap-1  items-center">
          <h4 className="text-lg">配置列表</h4>
          {/* 请修改下面的div元素 */}
          <div className="m-2 w-full text-center">
            <div className="  flex flex-col gap-1 m-2 px-1 h-[calc(100vh-300px)] overflow-auto">
              {export_types.map((tp) => (
                <div className="flex flex-row justify-between items-center border border-blue-200 rounded-sm px-2 py-1">
                  <p>{tp}</p>
                  <div className="flex flew-row gap-1">
                    <ToolButton
                      key={tp}
                      className="h-8 w-16"
                      tip={`删除:${tp}`}
                      onClick={() => DeletDir(tp)}
                    >
                      删除
                    </ToolButton>
                    <ToolButton
                      key={tp}
                      className="h-8 w-16"
                      tip={`打开文件夹:${tp}`}
                      onClick={() => OpenDir(tp)}
                    >
                      打开
                    </ToolButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant={"outline"}
              className="w-24 border-blue-600"
              onClick={OpenAsk}
            >
              新增
            </Button>
            <Button className="w-24 active:bg-slate-700" onClick={OnSave}>
              保存
            </Button>
          </div>
        </Card>

        <Dialog
          open={openAsk}
          onOpenChange={(e: boolean) => {
            setOpenAsk(e);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增导出类型</DialogTitle>
              <DialogDescription>
                你可以通过增加一个类型来导出更多的可能性，但是你需要将对应类型的配置文件保存到对应的目录下
              </DialogDescription>
              <Input
                value={newDir}
                onChange={(e: any) => {
                  setNewDir(e.target.value);
                }}
                placeholder="新增目录"
              ></Input>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setOpenAsk(false);
                    AddDir();
                  }}
                >
                  增加
                </Button>
              </DialogFooter>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default SettingView;
