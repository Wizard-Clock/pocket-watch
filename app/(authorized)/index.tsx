import {useRouter} from 'expo-router';
import {ActivityIndicator, Appbar, Portal, Snackbar} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import {useAuthSession} from "@/providers/AuthService";
import React, {useState} from "react";
import {SafeAreaView} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import Colors from "@/components/colorPalette";
import SettingsService from "@/providers/SettingsService";

export default function HomePage(){
    const {token} = useAuthSession();
    const locationSession = useLocationSession();
    const [viewDim, setViewDim] = useState({width: 0, height: 0});
    const settingsService = SettingsService.getInstance();

    // @ts-ignore
    const onLayout=(event)=> {
        const {height, width} = event.nativeEvent.layout;
        setViewDim({width: width, height: height});
        locationSession.resyncLocationServices();
    }

    // @ts-ignore
    let tokenVal = token?.current.token;
    const pocketWatchUrl = settingsService.getSettingValue("url") + "/api/watchFace";

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
                        icon="cog"
                        onPress={() => useRouter().navigate('/settings')}
                        color={Colors.background}/>
                </Appbar.Header>
                <WebView
                    style={{
                        position: "relative",
                        height: "100%",
                        width: "100%",
                        zIndex: 2
                    }}
                    startInLoadingState={true}
                    renderLoading={() =>
                        <ActivityIndicator
                            size={viewDim.width/2}
                            color={Colors.primary}
                            style={{
                                position: "absolute",
                                top: viewDim.height/3.5,
                                left: viewDim.width/4,
                                zIndex: 3
                            }}
                        />
                    }
                    source={{
                        uri: pocketWatchUrl,
                        headers: {
                            "Authorization": "Bearer " + tokenVal,
                        }
                    }}
                    onHttpError={(syntheticEvent) => {
                        console.log("onHttpError",syntheticEvent);
                    }}
                    cacheEnabled={false}
                    scrollEnabled={false}
                    cachePolicy="LOAD_NO_CACHE"
                    priority="high"
                    setBuiltInZoomControls={false}
                >
                </WebView>
                <Portal>
                    <Snackbar
                        visible={locationSession.portalSnackbarVisible}
                        onDismiss={() => locationSession.setPortalSnackbarVisible(false)}
                        action={{
                            textColor: Colors.secondary,
                            label: 'Dismiss'
                        }}
                    >
                        {locationSession.portalSnackbarText}
                    </Snackbar>
                </Portal>
            </SafeAreaView>
        </>
    )
}
