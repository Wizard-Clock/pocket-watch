import {useRouter} from 'expo-router';
import {Image as ExpoImage} from 'expo-image';
import {ActivityIndicator, Appbar, Button, Portal, Snackbar} from 'react-native-paper';
import {useAuthSession} from "@/providers/AuthService";
import React, {useEffect, useState} from "react";
import {SafeAreaView} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import Colors from "@/components/colorPalette";
import SettingsService from "@/providers/SettingsService";

export default function HomePage(){
    const {token, signOut} = useAuthSession();
    const locationSession = useLocationSession();
    const settingsService = SettingsService.getInstance();
    const [viewDim, setViewDim] = useState({width: 0, height: 0});
    const [imageURL, setImageURL] = useState("");
    const [imgLoading, setImgLoading] = useState(false);

    // @ts-ignore
    const onLayout=(event)=> {
        const {height, width} = event.nativeEvent.layout;
        locationSession.resyncLocationServices();
        let calcDimension = calculateAspectRatioFit(width, height);
        setViewDim({width: calcDimension.width, height: calcDimension.height});
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
    let tokenVal = token?.current.token;
    const pocketWatchUrl = settingsService.getSettingValue("url") + "/api/createPocketWatch";
    const reader = new FileReader();

    const getImageURL = async () => {
        fetch(pocketWatchUrl, {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + tokenVal
            }})
            .then((response)=> response.blob())
            .then((response)=> {
                reader.readAsDataURL(response);
                reader.onload = () => {
                    setImgLoading(false);
                    // @ts-ignore
                    setImageURL(reader.result);
                }
            })
            .catch(err=>{
                console.log(err);
            });
    }

    useEffect(() => {
        getImageURL();
    }, []);

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
                <ActivityIndicator
                    animating={imgLoading}
                    size={viewDim.width/2}
                    color={Colors.primary}
                    style={{
                        position: "absolute",
                        top: viewDim.height/1.5,
                        left: viewDim.width/4,
                        zIndex: 3
                    }}
                />
                <ExpoImage
                    id="pocketWatch"
                    style={{
                        position: "relative",
                        marginTop: 25,
                        width: viewDim.width,
                        height: viewDim.height,
                        backgroundColor: Colors.background,
                        zIndex: 2
                    }}
                    source={{
                        uri: imageURL,
                        width: 693,
                        height: 960
                    }}
                    contentFit='contain'
                    contentPosition="center"
                    cachePolicy="none"
                    priority="high"
                />
                <SafeAreaView
                    style={{
                        alignItems: "center"
                    }}>
                    <Button
                        mode="outlined"
                        textColor={Colors.primary}
                        style={{
                            width: "50%",
                            marginTop: 10
                        }}
                        disabled={imgLoading}
                        onPress={() => {
                            setImgLoading(true);
                            getImageURL();
                        }}
                    >
                        Refresh Watch
                    </Button>
                </SafeAreaView>
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
