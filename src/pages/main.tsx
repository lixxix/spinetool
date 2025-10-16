import { AllData, TodayData } from "@/components/type";
import { AnimatedNumber } from "@/components/ui/animated_number";
import {
  TextureCardHeader,
  TextureCardStyled,
  TextureCardTitle,
} from "@/components/ui/texture_card";

import { set_store_all, set_store_today } from "@/slice/storeSlice";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { invoke } from "@tauri-apps/api";
// import { checkUpdate } from "@tauri-apps/api/updater";
import { useEffect, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "./mark.css";
import { VersionUpdate } from "./version";

export default function MainPage() {
  const all = useAppSelector((state: RootState) => state.store.all);
  const today = useAppSelector((state: RootState) => state.store.today);
  // const share_data = useAppSelector((state: RootState) => state.share);

  const dispatch = useAppDispatch();
  // 通过后端库中获取数据
  useEffect(() => {
    invoke("get_today_data").then((data) => {
      dispatch(set_store_today(data as TodayData));
    });

    invoke("get_store_alldata").then((data) =>
      dispatch(set_store_all(data as AllData))
    );
  }, []);

  // const checkUpdates = async () => {
  //   let vv = await checkUpdate()
  //   console.log(vv)
  // }

  const CardData = (name: string, value: number) => {
    return useMemo(() => {
      return (
        <TextureCardStyled className="md:col-span-4 sm:col-span-12 xl:col-span-4">
          <TextureCardHeader className="flex flex-col gap-1 items-center justify-center">
            <TextureCardTitle>{name}</TextureCardTitle>
            <p className="whitespace-pre-wrap  font-medium tracking-tighter text-black dark:text-white text-center">
              {/* <NumberTicker value={value} /> */}
              <AnimatedNumber value={value} />
            </p>
          </TextureCardHeader>
        </TextureCardStyled>
      );
    }, [name, value]);
  };
  return (
    <>
      <div className="text-2xl mt-9 mb-20 font-blod">
        上次登录时间: {all.last_seen}
      </div>
      <div className="flex justify-between gap-4 h-[350px]">
        <div className="flex flex-col gap-2 flex-grow">
          <div className="text-xl font-bold">历史数据</div>
          <div className="flex-grow">
            <div className="text-xl grid grid-cols-12 gap-2">
              {CardData("导出", all.export)}
              {CardData("裁剪", all.split)}
              {CardData("还原", all.restore)}
            </div>
          </div>
          <div className="text-xl font-bold">今日数据</div>
          <div className="flex-grow ">
            <div className="text-xl grid grid-cols-12 gap-3">
              {CardData("导出", today.export)}
              {CardData("裁剪", today.split)}
              {CardData("还原", today.restore)}
            </div>
          </div>
          {/* <Button onClick={checkUpdates}>检查更新</Button> */}
        </div>
        <div className="w-[370px] h-[calc(100vh-200px)] overflow-y-auto markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} children={VersionUpdate}></ReactMarkdown>
        </div>
       
      </div>
    </>
  );
}
