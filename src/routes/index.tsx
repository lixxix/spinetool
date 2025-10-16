import SubSpineView from "@/components/sub_spine_view";
import DashboardLayout from "@/layout/DashboardLayout";
import { lazy, Suspense } from "react";
import { Outlet, useRoutes } from "react-router-dom";

const MainPage = lazy(() => import("@/pages/main"));
const SpineExportView = lazy(() => import("@/components/export_view"));
const RestoreView = lazy(() => import("@/components/restore_view"));
const ReviewView = lazy(() => import("@/components/review_view"));
const SplitView = lazy(() => import("@/components/split_view"));
const SettingView = lazy(() => import("@/components/setting_view"));

const VideoView = lazy(() => import("@/components/video_view"));



export default function Router() {
  const routes = useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { path: "", element: <MainPage />, index: true },
        { path: "export", element: <SpineExportView /> },
        { path: "restore", element: <RestoreView /> },
        { path: "review", element: <ReviewView /> },
        { path: "split", element: <SplitView /> },
        { path: "setting", element: <SettingView /> },
        { path: "video", element: <VideoView></VideoView> },
      ],
    },
    {
      path: "spineview",
      element: <SubSpineView></SubSpineView>,
    },
    
  ]);

  return routes;
}
