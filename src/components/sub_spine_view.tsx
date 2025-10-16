import 'pixi-spine';
import * as PIXI from 'pixi.js';
import { useContext, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { ISkeletonData,  Spine} from 'pixi-spine';
import { AppContext } from '@/app_provider';
import { useAppDispatch } from '@/store/hook';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { set_spine_scale } from '@/slice/subSpineSlice';

function SubSpineView() {
    const dispath = useAppDispatch();
    const scale = useSelector((state: RootState) => state.subspine.scale);

    // const [aniButton, setAniButton] = useState<string[]>([]);
    // const [skinOption, setSkinOption] = useState<string[]>([]);
    // const [useAlpha, setAplpha] = useState<boolean>(true);
    // const [ani, setAni] = useState<string>();
    // const [skin, setSkin] = useState<string>();
    // const [playSpeed, setPlaySpeed] = useState<number[]>([1.0]);
    // const [meshHull, setMeshHull] = useState(false);
    // const [meshTriangles, setMeshTriangles] = useState(false);
    // const [bones, setBones] = useState(false);
    // const [paths, setPaths] = useState(false);
    // const [boundingBox, setBoundingBox] = useState(false);
    // const [clipping, setClipping] = useState(false);
    // const [regionAttachment, setRegionAttachment] = useState(false);

    const [spineFile, setSpinFile] = useState<string | undefined>();

    const appRef = useRef<any>(null);
    const spineRef = useRef<any>(null);
    const scaleRef = useRef<any>(null);
    const aniRef = useRef<any>(null);
    // const debugRef = useRef<any>(null);

    let unlisten: any = null;

    const { size } = useContext(AppContext);

    function setAnimationSkin(skin: string) {
        if (spineRef.current) {
            // setSkin(skin);
            console.log("skin,", skin);
            spineRef.current.skeleton.setSkinByName(skin);
        }
    }

    useEffect(() => {

        const app = new PIXI.Application({
            width: size.width,
            height: size.height,
            backgroundColor: 0x2c3e50,
            resolution: 1,
            // premultipliedAlpha: true,
        });

        console.log("create sub spine veiw")
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

        const makeButton = (text: string): PIXI.Graphics => {
            const button = new PIXI.Graphics();
            // 设置按钮的属性
            button.beginFill(0x2c2e40, 1); // 按钮的填充颜色
            button.drawRect(0, 0, 150, 25); // x, y, width, height
            button.endFill();
            button.interactive = true; // 允许交互

            // 创建文本标签
            const buttonText = new PIXI.Text(text, {
                fontFamily: 'Arial', // 字体
                fontSize: 18, // 字号
                fill: 0xE0404D, // 字体颜色
                align: 'center', // 居中对齐
            });

            // 将文本标签定位到按钮中心
            buttonText.x = button.width / 2 - buttonText.width / 2;
            buttonText.y = button.height / 2 - buttonText.height / 2;
            // 将按钮和文本标签添加到舞台
            button.addChild(buttonText); // 重要：将文本作为按钮的子项

            return button;
        }

        const background = new PIXI.Graphics();
        background.beginFill(0x2c3e50, 1); // 完全透明
        background.drawRect(0, 0, app.renderer.width, app.renderer.height);
        background.endFill();
        background.interactive = true;
        app.stage.addChildAt(background, 0);

        let text = new PIXI.Text("infomation", style);
        let text_ani = new PIXI.Text("动画", style);
        aniRef.current = text_ani;

        if (spineFile) {
            try {
                PIXI.Assets.reset();
                PIXI.Assets.setPreferences({
                    preferCreateImageBitmap: false,
                });

                PIXI.Assets.add({ alias: "skeleton", src: spineFile });
                PIXI.Assets.load(["skeleton"]).then((data) => {
                    let spineData: ISkeletonData = data.skeleton.spineData;
                    let animations: string[] = [];
                    spineData.animations.forEach((animation) => {
                        animations.push(animation.name);
                    });
                    // setAniButton(animations);
                    console.log(animations)

                    let spine = new Spine(spineData);
                    spine.x = app.view.width / 2;
                    spine.y = app.view.height / 2;
                    // spine.setChildIndex()
                    app.stage.addChildAt(spine, 1);
                    spine.state.timeScale = scale;
                    spineRef.current = spine;

                    let skins: string[] = [];
                    spineData.skins.forEach((skin) => {
                        console.log(skin);
                        skins.push(skin.name);
                    })
                    // setSkinOption(skins);
                    console.log(spine.spineData.skins)

                    {
                        var skin_btns: PIXI.Graphics[] = [];
                        var skin_select: number = 0;
                        for (let i = 0; i < skins.length; i++) {
                            let skin_btn = makeButton(skins[i])

                            // 设置按钮的属性
                            if (i == skin_select) {
                                skin_btn.beginFill(0xEECC22, 1); // 按钮的填充颜色
                                skin_btn.drawRect(0, 0, 150, 25); // x, y, width, height
                                skin_btn.endFill();
                            }

                            skin_btn.x = app.view.width - 155
                            skin_btn.y = 45 + 30 * i;
                            app.stage.addChild(skin_btn);
                            skin_btns.push(skin_btn);
                            skin_btn.on('pointerdown', () => {
                                console.log('Button clicked!');
                                if (skin_select == i) {
                                    return;
                                } else {
                                    skin_btns[skin_select].beginFill(0x2c2e40, 1);
                                    skin_btns[skin_select].drawRect(0, 0, 150, 25);
                                    skin_btns[skin_select].endFill();
                                }
                                skin_select = i;
                                spine.skeleton.setSkinByName(skins[i]);

                                skin_btns[i].beginFill(0xEECC22, 1);
                                skin_btns[i].drawRect(0, 0, 150, 25);
                                skin_btns[i].endFill();
                            });
                        }
                        if (skins.length > 1) {
                            console.log("多个skin下选择第二个", skins[1]);
                            setAnimationSkin(skins[1]);
                        } else {
                            setAnimationSkin(skins[0]);
                        }
                    }



                    scaleRef.current = scale;
                    spine.scale = { x: scale, y: scale };

                    if (animations.length > 0) {
                        spine.state.setAnimation(0, animations[0], true);
                        text_ani.text = `动画:${animations[0]}`;
                    }

                    var btns: PIXI.Graphics[] = [];
                    var select: number = 0;
                    for (let i = 0; i < animations.length; i++) {
                        const button = new PIXI.Graphics();
                        // 设置按钮的属性
                        if (i == select) {
                            button.beginFill(0xEECC22, 1); // 按钮的填充颜色
                            button.drawRect(0, 0, 150, 25); // x, y, width, height
                            button.endFill();
                        } else {
                            button.beginFill(0x2c2e40, 1); // 按钮的填充颜色
                            button.drawRect(0, 0, 150, 25); // x, y, width, height
                            button.endFill();
                        }

                        button.x = 5;
                        button.y = 45 + 30 * i;
                        button.interactive = true; // 允许交互
                        // button.buttonMode = true; // 显示手型光标

                        // 创建文本标签
                        const buttonText = new PIXI.Text(animations[i], {
                            fontFamily: 'Arial', // 字体
                            fontSize: 18, // 字号
                            fill: 0xE0564D, // 字体颜色
                            align: 'center', // 居中对齐
                            // dropShadowColor: '#000000',
                        });

                        // 将文本标签定位到按钮中心
                        buttonText.x = button.width / 2 - buttonText.width / 2;
                        buttonText.y = button.height / 2 - buttonText.height / 2;

                        // 将按钮和文本标签添加到舞台
                        button.addChild(buttonText); // 重要：将文本作为按钮的子项

                        // 添加按钮到Pixi舞台
                        app.stage.addChild(button);
                        btns.push(button);
                        // 设置按钮的点击回调函数
                    }

                    for (let i = 0; i < btns.length; i++) {
                        btns[i].on('pointerdown', () => {
                            console.log('Button clicked!');
                            if (select == i) {
                                return;
                            } else {
                                btns[select].beginFill(0x2c2e40, 1); // 按钮的填充颜色
                                btns[select].drawRect(0, 0, 150, 25); // x, y, width, height
                                btns[select].endFill();
                            }

                            select = i;
                            spine.state.setAnimation(0, animations[i], true);
                            text_ani.text = `动画:${animations[i]}`;

                            btns[i].beginFill(0xEECC22, 1)
                            btns[i].drawRect(0, 0, 150, 25)
                            btns[i].endFill()
                        });
                    }

                    // let debug = new SpineDebugRenderer();
                    // debug.drawMeshHull = meshHull;
                    // debug.drawMeshTriangles = meshTriangles;
                    // debug.drawBones = bones;
                    // debug.drawPaths = paths;
                    // debug.drawBoundingBoxes = boundingBox;
                    // debug.drawClipping = clipping;
                    // debug.drawRegionAttachments = regionAttachment;

                    // spine.debug = debug;
                    // debugRef.current = debug;

                    text.text = `x:${spineRef.current.position.x.toFixed(1)},y:${spineRef.current.position.y.toFixed(1)}  scale:${scaleRef.current.toFixed(2)} w:${size.width} h:${size.height}`;

                }).catch(err => {
                    console.error(err);
                })
            } catch (err) {
                // console.error(err);

                const errorText = new PIXI.Text(err as any, {
                    fontFamily: 'Arial', // 字体
                    fontSize: 18, // 字号
                    fill: 0xFF004D, // 字体颜色
                    align: 'center', // 居中对齐
                });
                errorText.x = app.view.width / 2;
                errorText.y = app.view.height / 2;
                app.stage.addChild(errorText);
            }
       
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

        listen('child-window-event', (event: any) => {
            console.log('Received data:', event.payload);
            setSpinFile(event.payload.data as any);
        }).then(ln => {
            unlisten = ln;
        });

        return () => {
            app.destroy(true, false);
            dispath(set_spine_scale(scaleRef.current))
            if (unlisten) {
                unlisten();
            }
        }
    }, [spineFile, size]);

    return (
        <>
            <div className="flex w-full h-screen justify-center items-center bg-[#2c3e50]">
                <div ref={appRef}></div>
                {/* <div className={`w-[${size.width}px] h-[${size.height}px] `} ref={appRef}></div> */}
            </div>
        </>
    );
}

export default SubSpineView;