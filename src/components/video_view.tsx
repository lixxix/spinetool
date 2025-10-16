import { invoke } from "@tauri-apps/api/tauri";
import { Button } from "./ui/button";
function VideoView() {
  async function goToBilibili() {
    invoke("open_browser", {
      url: "https://www.bilibili.com/video/BV1K2aTeqEFk",
    })
      .then(() => {
        console.log("Browser opened");
      })
      .catch((error) => {
        console.error("Failed to open browser:", error);
      });
  }

  return (
    <div className="flex flex-col gap-1">
      <iframe
        src="//player.bilibili.com/player.html?bvid=BV1K2aTeqEFk&;page=1"
        className="w-[100%] h-[calc(100vh-118px)] m-auto my-0"
      />
      <Button className="w-[100%] m-auto my-0" onClick={goToBilibili}>
        前往哔哩哔哩观看高清
      </Button>
    </div>
  );
}

export default VideoView;
