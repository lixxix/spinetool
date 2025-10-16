import 'pixi-spine';
import * as PIXI from 'pixi.js';
import { useContext, useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import "@/components/dialog_spine_view.css";
import { Separator } from "./ui/separator";
import { ISkeletonData, Spine, SpineDebugRenderer } from 'pixi-spine';
import { VSize } from './type';
import "@/components/select.css";
import "@/App.css"
import { cn } from '@/lib/utils';
import { DialogSpineContext } from './dialog_spine_provider';
import { Slider } from "@/components/ui/slider"
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useAppSelector } from '@/store/hook';
import { RootState } from '@/store';

type SpineViewProps = {
    size: VSize;
    className?: string;
}
    
function DialogSpineView({ size }: SpineViewProps) {

    const [scale, setScale] = useState<number>(1.0);
    const [timeScale, setTimeScale] = useState<number>(1.0);
    const [aniButton, setAniButton] = useState<string[]>([]);
    const [skinOption, setSkinOption] = useState<string[]>([]);
    const [useAlpha, setAplpha] = useState<boolean>(true);
    const [ani, setAni] = useState<string>();
    const [skin, setSkin] = useState<string>();
    const [playSpeed, setPlaySpeed] = useState<number[]>([1.0]);
    const [meshHull, setMeshHull] = useState(false);
    const [meshTriangles, setMeshTriangles] = useState(false);
    const [bones, setBones] = useState(false);
    const [paths, setPaths] = useState(false);
    const [boundingBox, setBoundingBox] = useState(false);
    const [clipping, setClipping] = useState(false);
    const [regionAttachment, setRegionAttachment] = useState(false);

    const ani_info = useAppSelector((state:RootState) => state.animation.info);

    const divRef = useRef(null);
    const appRef = useRef<any>(null);
    const spineRef = useRef<any>(null);
    const scaleRef = useRef<any>(null);
    const aniRef = useRef<any>(null);
    const debugRef = useRef<any>(null);

    // 通过上下文传递进来的数据
    const { spineFile, showSpine, setShowSpine } = useContext(DialogSpineContext)

    useEffect(() => {

        const app = new PIXI.Application({
            width: size.width,
            height: size.height,
            backgroundColor: 0x2c3e50,
            resolution: 1,
            // premultipliedAlpha: true,
        });

        appRef.current?.appendChild(app.view as any);  //绑定元素
        scaleRef.current = 1;
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 14,
            fill: '#ffffff',
            stroke: '#DfEF00',
            strokeThickness: 1,
            // dropShadow: true,
            // dropShadowColor: '#000000',
            // dropShadowBlur: 4,
            // dropShadowAngle: Math.PI / 6,
            // dropShadowDistance: 6,
        });

        const background = new PIXI.Graphics();
        background.beginFill(0x2c3e50, 1); // 完全透明
        background.drawRect(0, 0, app.renderer.width, app.renderer.height);
        background.endFill();
        background.interactive = true;
        app.stage.addChildAt(background, 0);

        let text = new PIXI.Text("infomation", style);
        let text_ani = new PIXI.Text("动画", style);
        aniRef.current = text_ani;

        if (spineFile != "") {
            console.log("spinefile is already", spineFile);
            PIXI.Assets.reset();
            PIXI.Assets.setPreferences({
                preferCreateImageBitmap: useAlpha,
            });

            PIXI.Assets.add({ alias: "skeleton", src: spineFile });
            PIXI.Assets.load(["skeleton"]).then((data) => {
                let spineData: ISkeletonData = data.skeleton.spineData;
                console.log("spine dat", spineData)
                let animations: string[] = [];
                spineData.animations.forEach((animation) => {
                    animations.push(animation.name);
                });
                setAniButton(animations);
                console.log(animations)

                let spine = new Spine(spineData);
                spine.x = app.screen.width / 2;
                spine.y = app.screen.height / 2;
                // spine.setChildIndex()
                app.stage.addChildAt(spine, 1);
                spine.state.timeScale = timeScale;
                spineRef.current = spine;

                let skins: string[] = [];
                spineData.skins.forEach((skin) => {
                    console.log(skin);
                    skins.push(skin.name);
                })
                setSkinOption(skins);
                console.log(spine.spineData.skins)

                scaleRef.current = timeScale;
                spine.scale = { x: scale, y: scale };

                if (animations.length > 0) {
                    spine.state.setAnimation(0, animations[0], true);
                    text_ani.text = `动画:${animations[0]}`;
                }
                let debug = new SpineDebugRenderer();
                // Master toggle
                // debug.drawDebug = false;
                // Per feature toggle
                debug.drawMeshHull = meshHull;
                debug.drawMeshTriangles = meshTriangles;
                debug.drawBones = bones;
                debug.drawPaths = paths;
                debug.drawBoundingBoxes = boundingBox;
                debug.drawClipping = clipping;
                debug.drawRegionAttachments = regionAttachment;

                spine.debug = debug;
                debugRef.current = debug;
                if (skins.length > 1) {
                    console.log("多个skin下选择第二个", skins[1]);
                    setAnimationSkin(skins[1]);
                } else {
                    setAnimationSkin(skins[0]);
                }
                text.text = `x:${spineRef.current.position.x.toFixed(1)},y:${spineRef.current.position.y.toFixed(1)}  scale:${scaleRef.current.toFixed(2)} w:${size.width} h:${size.height}`;
            })
        }
        // 事件
        app.stage.interactive = true;
        let dragFlag = false;
        let startPoint: any;
        app.stage.on("mousedown", (event: any) => {
            dragFlag = true
            startPoint = { x: event.data.global.x, y: event.data.global.y }
        })

        app.stage.on("mousemove", (event: any) => {
            if (dragFlag) {
                const dx = event.data.global.x - startPoint.x;
                const dy = event.data.global.y - startPoint.y;
                spineRef.current.position.x += dx;
                spineRef.current.position.y += dy;
                text.text = `x:${spineRef.current.position.x.toFixed(1)},y:${spineRef.current.position.y.toFixed(1)}  scale:${scaleRef.current.toFixed(2)}`;
                startPoint = { x: event.data.global.x, y: event.data.global.y }
            }
        })

        app.stage.on("mouseup", (_event: any) => {
            dragFlag = false
        });

        (app.view as any).addEventListener('wheel', (event: any) => {
            // event.deltaY 包含了滚轮滚动的信息
            // 当滚轮向上滚动时，deltaY 为负值
            // 当滚轮向下滚动时，deltaY 为正值
            // console.log(scaleRef.current, "scale")
            if (event.deltaY < 0) {
                scaleRef.current *= 1.05;
            } else {
                scaleRef.current *= 0.95;
            }
            spineRef.current.scale = { x: scaleRef.current, y: scaleRef.current };
            console.log(scaleRef.current, "scale");
            setScale(scaleRef.current);
            text.text = `x:${spineRef.current.position.x.toFixed(1)},y:${spineRef.current.position.y.toFixed(1)}  scale:${scaleRef.current.toFixed(2)}`;
            // 这里可以根据滚动的方向和距离来执行相应的操作
            // 例如，可以用来缩放舞台或滚动内容
            // 阻止默认滚动事件，特别是当你不希望页面随着鼠标滚轮滚动时
            event.preventDefault();
        }, { passive: false });

        text.x = 10;
        text.y = 10;

        text_ani.x = 10;
        text_ani.y = size.height - 30;

        app.stage.addChild(text);
        app.stage.addChild(text_ani);
        return () => app.destroy(true, false);
    }, [spineFile, useAlpha, size]);

    function setAnimation(animation: string) {
        if (spineRef.current && spineRef.current.state.hasAnimation(animation)) {
            spineRef.current.state.setAnimation(0, animation, true);
            aniRef.current.text = `动画:${animation}`;
        }
    }
    function setAnimationSkin(skin: string) {
        if (spineRef.current) {
            setSkin(skin);
            console.log("skin,", skin);
            spineRef.current.skeleton.setSkinByName(skin);
        }
    }

    return (
        <>
            <div className={cn("sp_container", !showSpine ? "hidden" : "")} ref={divRef} onClick={() => {
                setShowSpine(false);
                PIXI.Assets.unload(spineFile);
            }}>
                <Card className="w-full h-full shadow-xl pt-6 px-8 pb-5 flex flex-col items-center" onClick={(e) => { console.log("click"); e.stopPropagation() }}>
                    <div className='flex flex-row w-full justify-between'>
                        <div className='w-full text-left gap-2 grid grid-cols-2'>
                            <p className="col-span-1">名称:{ani_info.name}</p> 
                            <p className='col-span-1'>版本:{ani_info.version}</p>
                        </div>
                        <button onClick={() => setShowSpine(false)} className="hover:border w-5 h-5 leading-5 active:bg-slate-500 ">✕</button>
                    </div>
                    <Separator></Separator>
                    <div className={`w-[${size.width}px] h-[${size.height}px]  my-2`} ref={appRef}></div>
                    <div className="flex gap-2 items-start w-full h-[250px] border rounded-md shadow-sm">
                        <div className="flex flex-row flex-grow h-full">
                            <div className="border rounded-sm p-4 h-full text-center space-y-2 w-[180px] flex flex-col justify-evenly items-center">
                                <div className='flex flex-col gap-1 border rounded-sm px-6 py-2'>
                                    <p>动画:</p>
                                    <select value={ani} onChange={(e) => {
                                        setAni(e.target.value);
                                        setAnimation(e.target.value)
                                    }} className='select-style'>
                                        {
                                            aniButton.map((vv) => (
                                                <option key={vv} value={vv}>{vv}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className='flex flex-col gap-1 border rounded-sm px-6 py-2'>
                                    <p>皮肤:</p>
                                    <select value={skin} onChange={(e) => {
                                        setAnimationSkin(e.target.value)
                                    }} className='select-style'>
                                        {
                                            skinOption.map((vv) => (
                                                <option key={vv} value={vv}>{vv}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="border rounded-sm flex-grow px-4 py-2 flex flex-col gap-2  whitespace-nowrap">
                                <div className="flex flex-row rounded-sm border items-center gap-2 p-4">
                                    <p className="text-sm">播放速度</p>
                                    <Slider value={playSpeed} step={0.1} max={5} onValueChange={(e) => {
                                        setPlaySpeed(e)
                                        spineRef.current.state.timeScale = e[0];
                                        setTimeScale(e[0]);
                                    }} className="flex-grow" />
                                    <p className='bord text-md px-4 w-[50px]'>{playSpeed[0]}</p>
                                </div>
                                <h1 className='text-sm text-red-700 text-center'>可拖动移动动画，鼠标滚轮可以缩放动画</h1>
                                <div className="border flex flex-row gap-2 p-2 h-full">
                                    <p>Debug</p>
                                    <div className='w-full rounded-sm flex flex-col gap-2'>
                                        <div className="grid grid-cols-3 gap-2 w-full">
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="MeshHull" checked={meshHull} onCheckedChange={(e) => {
                                                    setMeshHull(e);
                                                    if (debugRef.current)
                                                        debugRef.current.drawMeshHull = e;
                                                }} ></Switch>
                                                <Label htmlFor="MeshHull">MeshHull</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="MeshTriangles" checked={meshTriangles} onCheckedChange={(e) => {
                                                    setMeshTriangles(e);
                                                    if (debugRef.current)
                                                        debugRef.current.drawMeshTriangles = e;
                                                }}></Switch>
                                                <Label htmlFor="MeshTriangles">MeshTriangles</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="Bones" checked={bones} onCheckedChange={(e) => {
                                                    setBones(e);
                                                    if (debugRef.current)
                                                        debugRef.current.drawBones = e;
                                                }}></Switch>
                                            <Label htmlFor="Bones">Bones</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="BoundingBoxes" checked={boundingBox} onCheckedChange={(e) => {
                                                    setBoundingBox(e);
                                                    if (debugRef.current)
                                                        debugRef.current.drawBoundingBoxes = e;
                                                }}></Switch>
                                                <Label htmlFor="BoundingBoxes">BoundingBoxes</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="Clipping" checked={clipping} onCheckedChange={(e) => {
                                                    setClipping(e);
                                                    if (debugRef.current)
                                                        debugRef.current.drawClipping = e;
                                                }}></Switch>
                                                <Label htmlFor="Clipping">Clipping</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="RegionAttachment" checked={regionAttachment} onCheckedChange={(e) => {
                                                    setRegionAttachment(e)
                                                    if (debugRef.current)
                                                        debugRef.current.drawRegionAttachments = e
                                                }} ></Switch>
                                                <Label htmlFor="RegionAttachment">RegionAttachment</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="Paths" checked={paths} onCheckedChange={(e) => {
                                                    setPaths(e)
                                                    if (debugRef.current)
                                                        debugRef.current.drawPaths = e;
                                                }}></Switch>
                                                <Label htmlFor="Paths">Paths</Label>
                                            </div>
                                            <div className='flex items-center gap-2 my-1'>
                                                <Switch id="Paths" checked={useAlpha} onCheckedChange={(e) => {
                                                    setAplpha(e)
                                                }}></Switch>
                                                <Label htmlFor="Paths">预乘Alpha</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div >
        </>
    )
}

export default DialogSpineView;