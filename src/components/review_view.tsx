import { useContext } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { open } from "@tauri-apps/api/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { set_review_files, set_review_root } from "@/slice/reviewSlice";
import { LoadingContext } from "./unit/loading_provider";
import { invoke } from "@tauri-apps/api";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ReviewDetail } from "./type";
function ReviewView() {
  const root_dir = useAppSelector((state) => state.review.root);
  const review_files = useAppSelector((state) => state.review.review_files);
  const dispatch = useAppDispatch();

  const loading = useContext(LoadingContext);
  async function BrowserSpineRoot() {
    const select = await open({
      directory: true,
      multiple: false,
    });

    if (select) {
      dispatch(set_review_root(select as string));
      try {
        loading?.setShow(true);
        loading?.setInfo("正在解析数据...");
        let restore_file = await invoke("loop_review", { root: select });
        console.log("restore file: ", restore_file);
        dispatch(set_review_files(restore_file as ReviewDetail[]));
        loading?.setShow(false);
      } catch (err) {
        toast(err as string);
      }
    }
  }

  async function OnCheckAnimation(spine_file: any) {
    // 先将文件拷贝到对应的位置，然后传递相对的文件路径。
    try {
      //   setPreview(() => spine_file.atlas);
      await invoke("show_view", {
        version: spine_file.version,
        filepath: spine_file.data,
      });
    } catch (err) {
      toast.error(err as string);
    }
    return;
  }

  return (
    <>
      <div className="flex flex-col gap-2 text-sm">
        <Card className="flex flex-col gap-1.5 p-2">
          <div className="grid grid-cols-12 w-full items-center gap-2">
            <p className="col-span-2 self-right text-right">预览文件夹:</p>
            <Input
              type="text"
              value={root_dir}
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
          //   ref={scrollableRef}
          className="h-[calc(100vh-140px)] overflow-auto whitespace-nowrap"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-[40px]">查看</TableHead>
                <TableHead>文件路径</TableHead>
                <TableHead className="text-center w-[60px]">版本</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {review_files.map((data) => (
                <TableRow
                  key={data.atlas}
                >
                  <TableCell className="text-center">
                      <Button
                        className="h-6 w-12 text-sm"
                        onClick={() => OnCheckAnimation(data)}
                      >
                        预览
                      </Button>
                   
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {data.data.length < 60
                        ? data.data
                        : "..." +
                          data.data.slice(
                            data.data.length - 57,
                            data.data.length
                          )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{data.version}</TableCell>    
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
export default ReviewView;
