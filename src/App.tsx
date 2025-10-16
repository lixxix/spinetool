import { listen } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/tauri";
import { useContext, useEffect, useMemo } from "react";

import { set_export_version } from "./slice/exportSlice";
import { set_current, set_version } from "./slice/spineSlice";
import { useAppDispatch } from "./store/hook";

import { toast } from "sonner";
import { set_export_setting, set_export_types, set_setting } from "./slice/settingSlice";

import { appWindow } from "@tauri-apps/api/window";
import { AppContext } from "./app_provider";
import DialogSpineProvider from "./components/dialog_spine_provider";
import DialogSpineView from "./components/dialog_spine_view";
import { VSize } from "./components/type";
import Loading from "./components/unit/loading";
import LoadingProvider from "./components/unit/loading_provider";
import Router from "./routes";

function App() {

  const { size, setSize } = useContext(AppContext);

  const dispatch = useAppDispatch();
  const memoSize = useMemo(() => {
    let ret: VSize = { width: Math.floor(size.width / window.devicePixelRatio - 60), height: Math.floor(size.height / window.devicePixelRatio - 330) };
    return ret;
  }, [size])

  let unlistenFn: any = null;
  let unlistenFromBack: any = null;

  async function get_size() {
    let sz = await appWindow.innerSize();
    setSize({ width: Math.floor(sz.width / window.devicePixelRatio), height: Math.floor(sz.height / window.devicePixelRatio) });
    console.log("dialog size", sz.width, sz.height)
  }

  function Init() {
    invoke("get_spine_version").then(data => {
      console.log(data);
      dispatch(set_version(data as string[]));
    });

    invoke("get_current_version").then(data => {
      dispatch(set_current(data as string))
      dispatch(set_export_version(data as string))
    })

    invoke("get_setting").then((data: any) => {
      // console.log("get_setting", data);
      dispatch(set_setting(data));
    })

    invoke("get_export_data").then((data: any) => {
      let map: { [key: string]: { [key: string]: string } } = data.map;
      let types = Object.keys(map);
      dispatch(set_export_types(types))
      dispatch(set_export_setting(data.map))
    })

    invoke("init_database", { dbname: "database.db" }).then(() => {
      console.log("init_database oK");
    }).catch(err => {
      console.log(err);
    })
  }

  function onWindowSize(e: any) {
    setSize({ width: Math.floor(e.payload.width / window.devicePixelRatio), height: Math.floor( e.payload.height / window.devicePixelRatio) });
    console.log("windows resize :", e);
  }

  useEffect(() => {
    get_size();
    Init();
    appWindow.isMaximized
    listen('export-callback', (event: any) => {
      console.log("export-callback", event.payload);
    }).then((ulisten) => {
      unlistenFn = ulisten;
    });

    listen("back-error", (event: any) => {
      console.log("back-error", event);
    }).then((ulisten) => {
      unlistenFromBack = ulisten;
    });

    appWindow.onResized(onWindowSize);

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
      if (unlistenFromBack) {
        unlistenFromBack()
      }

    }
  }, [toast])


  return (
    <DialogSpineProvider>
      <div className="select-none">
        <LoadingProvider>
          <Router></Router>
          <Loading></Loading>
        </LoadingProvider>
        <DialogSpineView size={memoSize}></DialogSpineView>
      </div>
    </DialogSpineProvider>
  );
}

export default App;

