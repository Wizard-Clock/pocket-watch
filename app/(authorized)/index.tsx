import {useRouter} from 'expo-router';
import {Image as ExpoImage} from 'expo-image';
import {Appbar} from 'react-native-paper';
import {useAuthSession} from "@/providers/AuthService";
import React, {useState} from "react";
import {SafeAreaView, View} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import Colors from "@/components/colorPalette";
import SettingsService from "@/providers/SettingsService";

export default function HomePage(){
    const {token, signOut} = useAuthSession();
    const locationSession = useLocationSession();
    const settingsService = SettingsService.getInstance();
    const [viewWidth, setViewWidth] = useState(0);
    const [viewHeight, setViewHeight] = useState(0);

    // @ts-ignore
    const onLayout=(event)=> {
        const {height, width} = event.nativeEvent.layout;
        let calcDimension = calculateAspectRatioFit(width, height);
        setViewHeight(calcDimension.height);
        setViewWidth(calcDimension.width);
    }

    /**
     * Conserve aspect ratio of the original region. Useful when shrinking/enlarging
     * images to fit into a certain area.
     * Source Width = 693
     * Source Height = 960
     * source: https://stackoverflow.com/a/14731922
     *
     * @param {Number} maxWidth maximum available width
     * @param {Number} maxHeight maximum available height
     * @return {Object} { width, height }
     */
    function calculateAspectRatioFit(maxWidth: number, maxHeight: number) {
        let ratio = Math.min(maxWidth / 693, maxHeight / 960);
        return {width: 693 * ratio, height: 960 * ratio, ratio: ratio};
    }

    // @ts-ignore
    let tokenVal= token?.current.token;
    const pocketWatchUrl = settingsService.getSettingValue("url") + "/api/createPocketWatch";

    return (
        <>
            <SafeAreaView
                style={{
                    backgroundColor: Colors.background,
                    height: "100%",
                }}
                onLayout={onLayout}
            >
                <Appbar.Header
                    style={{
                        backgroundColor: Colors.primary
                    }}
                    theme={{ colors: { primary: 'green' } }}
                >
                    <Appbar.Action
                        icon={locationSession.locationIcon}
                        onPress={locationSession.toggleLocationService}
                        isLeading={true}
                        color={Colors.background}
                    />
                    <Appbar.Content title="Pocket Watch" color={Colors.background}/>
                    <Appbar.Action
                        icon="logout"
                        onPress={signOut}
                        color={Colors.background} />
                    <Appbar.Action
                        icon="cog"
                        onPress={() => useRouter().navigate('/settings')}
                        color={Colors.background}/>
                </Appbar.Header>
                <ExpoImage
                    style={{
                        marginTop: 25,
                        width: viewWidth,
                        height: viewHeight,
                        backgroundColor: Colors.background
                    }}
                    source={{
                        uri: pocketWatchUrl,
                        headers: {
                            "Authorization": "Bearer " + tokenVal
                        },
                        width: 693,
                        height: 960
                    }}
                    contentFit='contain'
                    contentPosition="center"
                    cachePolicy="none"
                    priority="high"

                />
            </SafeAreaView>
        </>
    )
}
