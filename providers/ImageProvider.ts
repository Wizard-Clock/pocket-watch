import {Asset} from "expo-asset";

const pocketWatch = {
    image: Asset.fromModule(require("@/assets/images/pocket-watch-clock-face.png")),
    width: 693,
    height: 960
};
const clockHand = Asset.fromModule(require("@/assets/images/half-scissor-outline.png"));

export default{
    pocketWatch,
    clockHand
};