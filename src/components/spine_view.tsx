import 'pixi-spine';
import * as PIXI from 'pixi.js';
import { ISkeletonData, Spine } from 'pixi-spine';
import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '@/app_provider';

type PropsSpine = {
    data: string;
    useAlpha: boolean;
    scale: number;
}

function SpineView({ data, useAlpha, scale }: PropsSpine) {
    const appRef = useRef<any>(null);
    const spineRef = useRef<any>(null);
    const scaleRef = useRef<any>(null);
    const aniRef = useRef<any>(null);
    const [aniButton, setAniButton] = useState<string[]>([]);

    const appContext = useContext(AppContext)

    const size = { width: appContext.size.width - 225, height: appContext.size.height - 300 }

    function setAnimation(animation: string) {
        if (spineRef.current && spineRef.current.state.hasAnimation(animation)) {
            spineRef.current.state.setAnimation(0, animation, true);
            aniRef.current.text = `动画:${animation}`;
        }
    }

    useEffect(() => {

        const app = new PIXI.Application({
            width: size.width,
            height: size.height,
            backgroundColor: 0xffffff,
            resolution: 1,
        });

        appRef.current?.appendChild(app.view as any);  //绑定元素
        scaleRef.current = 1;
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fill: '#ffffff',
            stroke: '#DfEF00',
            strokeThickness: 1,
        });

        console.log(app.renderer.width, app.renderer.height)
        const background = new PIXI.Graphics();
        background.beginFill(0x2c3e50, 1); // 完全透明
        background.drawRect(0, 0, app.renderer.width, app.renderer.height);
        background.endFill();
        background.interactive = true;
        app.stage.addChildAt(background, 0);

        let text = new PIXI.Text("infomation", style);
        let text_ani = new PIXI.Text("动画", style);
        aniRef.current = text_ani;

        if (data != "") {
            PIXI.Assets.reset();
            PIXI.Assets.setPreferences({
                preferCreateImageBitmap: useAlpha,
            });
            // console.log(data);
            // PIXI.Assets.add("skeleton", data, { mode: 'no-cors' });
            PIXI.Assets.add({ alias: "skeleton", src: data });
            PIXI.Assets.load(["skeleton"]).then((data) => {
                let spineData: ISkeletonData = data.skeleton.spineData;

                let animations: string[] = [];
                spineData.animations.forEach((animation) => {
                    animations.push(animation.name);
                });
                setAniButton(animations);

                let spine = new Spine(spineData);
                spine.x = app.screen.width / 2;
                spine.y = app.screen.height / 2;

                app.stage.addChildAt(spine, 1);
                spine.state.timeScale = 1;
                spineRef.current = spine;

                if (scale > 0) {
                    scaleRef.current = scale;
                    spine.scale = { x: scale, y: scale };
                }


                if (animations.length > 0) {
                    spine.state.setAnimation(0, animations[0], true);
                    text_ani.text = `动画:${animations[0]}`;
                }

                text.text = `x:${spineRef.current.position.x.toFixed(1)},y:${spineRef.current.position.y.toFixed(1)}  scale:${scaleRef.current.toFixed(2)}`;
            }).catch(err => {
                console.log(err);
            })
        }
        // 事件
        app.stage.interactive = true;
        let dragFlag = false;
        let startPoint: any;
        app.stage.on("mousedown", (event: any) => {
            dragFlag = true
            console.log("se", app.stage.interactive);
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
            if (event.deltaY < 0) {
                scaleRef.current *= 1.05;
            } else {
                scaleRef.current *= 0.95;
            }
            spineRef.current.scale = { x: scaleRef.current, y: scaleRef.current };
            text.text = `x:${spineRef.current.position.x.toFixed(1)},y:${spineRef.current.position.y.toFixed(1)}  scale:${scaleRef.current.toFixed(2)}`;
            event.preventDefault();
        }, { passive: false });

        text.x = 10;
        text.y = 10;

        text_ani.x = 10;
        text_ani.y = app.view.height - 30;

        app.stage.addChild(text);
        app.stage.addChild(text_ani);
        return () => app.destroy(true, false);
    }, [appContext.size , data]);

    return (
        <>
            <div ref={appRef}></div>
            <div className='gap-1 flex flex-row h-[calc(100vh-160px)] overflow-auto items-center whitespace-nowrap'>
                <select onChange={(e) => {
                    console.log("sleect change", e.target.value);
                    setAnimation(e.target.value)
                }} className='select-style'>
                    {
                        aniButton.map((vv) => (
                            <option key={vv} value={vv}>{vv}</option>
                        ))
                    }
                </select>
            </div>
        </>
    );
}

export default SpineView;