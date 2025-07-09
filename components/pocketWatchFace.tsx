import React, {useState} from 'react';
import Canvas, {Image as CanvasImage} from 'react-native-canvas';
import {cubicBezier} from "motion";
import {SafeAreaView} from "react-native";
import ImageProvider from "@/providers/ImageProvider";

export const PocketWatchFace = () => {
    const [viewWidth, setViewWidth] = useState(0);
    const [viewHeight, setViewHeight] = useState(0);

    // @ts-ignore
    const onLayout=(event)=> {
        const {height, width} = event.nativeEvent.layout;
        setViewHeight(height);
        setViewWidth(width);
    }

    // @ts-ignore
    const handleCanvas = (canvas) => {
        if (!canvas) return;
        let updateOccurred = true;
        let canvasDim = calculateAspectRatioFit(
            ImageProvider.pocketWatch.width, ImageProvider.pocketWatch.height,
            viewWidth, viewHeight);
        canvas.width = canvasDim.width;
        canvas.height = canvasDim.height;

        const scissorEasing = cubicBezier(.33, -0.24, .56, 1.07);
        const scissorObj = new CanvasImage(canvas, 75* canvasDim.ratio, 450* canvasDim.ratio);
        scissorObj.src = ImageProvider.clockHand.uri;
        const clockFace = new CanvasImage(canvas, canvasDim.height, canvasDim.width);
        clockFace.src = ImageProvider.pocketWatch.image.uri;
        clockFace.addEventListener('load', () => {
            drawClock();
        });

        const ctx = canvas.getContext('2d');

        async function drawClock() {
            // await refreshWizardData();
            if(updateOccurred){
                ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);
                ctx.drawImage(clockFace, 0, 0, canvasDim.width, canvasDim.height);
                ctx.translate(canvasDim.width / 2, canvasDim.height / 2);
                // await drawNumbers(ctx, (canvasDim.height) / 2, clockPositions);
                // await drawTime(ctx, (canvasDim.height) / 2, clockPositions, wizardWithPositionArray);
                ctx.translate(-(canvasDim.width / 2), -(canvasDim.height / 2));
                updateOccurred = false;
            }
            window.requestAnimationFrame(drawClock);
        }
    };

    /**
     * Conserve aspect ratio of the original region. Useful when shrinking/enlarging
     * images to fit into a certain area.
     * source: https://stackoverflow.com/a/14731922
     *
     * @param {Number} srcWidth width of source image
     * @param {Number} srcHeight height of source image
     * @param {Number} maxWidth maximum available width
     * @param {Number} maxHeight maximum available height
     * @return {Object} { width, height }
     */
    function calculateAspectRatioFit(srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) {
        let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {width: srcWidth * ratio, height: srcHeight * ratio, ratio: ratio};
    }

    return (
        <SafeAreaView onLayout={onLayout}>
            <Canvas ref={handleCanvas} style={{ width: '100%', height: '100%'}} />
        </SafeAreaView>
    );
}