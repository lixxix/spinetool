import { appWindow } from '@tauri-apps/api/window';
import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const updateMaximizeState = async () => {
            setIsMaximized(await appWindow.isMaximized());
        };

        updateMaximizeState();

        const unlisten = appWindow.onResized(() => {
            updateMaximizeState();
        });

        return () => {
            unlisten.then(f => f());
        };
    }, []);

    const sidebarWidth = '12rem'; // w-48 is 12rem

    return (
        <div
            data-tauri-drag-region
            className="h-10 bg-gray-50 border-b border-gray-200 flex justify-end items-center fixed top-0 right-0 z-50 transition-all duration-300 ease-in-out"
            style={{ left: sidebarWidth }}
        >
            <div className="flex gap-0">
                <div
                    title="Minimize"
                    className="w-12 h-8 flex justify-center items-center hover:bg-gray-200 transition-colors"
                    onClick={() => appWindow.minimize()}
                >
                    <Minus size={16} />
                </div>
                <div
                    title={isMaximized ? "Restore" : "Maximize"}
                    className="w-12 h-8 flex justify-center items-center hover:bg-gray-200 transition-colors"
                    onClick={() => appWindow.toggleMaximize()}
                >
                    {isMaximized ? <Copy size={14} /> : <Square size={14} />}
                </div>
                <div
                    title="Close"
                    className="w-12 h-8 flex justify-center items-center hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => appWindow.close()}
                >
                    <X size={16} />
                </div>
            </div>
        </div>
    );
}

export default TitleBar;
