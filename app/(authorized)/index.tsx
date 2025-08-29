import {useRouter} from 'expo-router';
import {ActivityIndicator, Appbar, Button, Portal, Snackbar} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import {useAuthSession} from "@/providers/AuthService";
import React, {useState} from "react";
import {Modal, SafeAreaView} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import Colors from "@/components/colorPalette";
import SettingsService from "@/providers/SettingsService";
import {Dropdown} from "react-native-element-dropdown";
import {ListItem} from "react-native-elements";

export default function HomePage(){
    const {token} = useAuthSession();
    const locationSession = useLocationSession();
    const [manualLocationsLoading, setManualLocationsLoading] = useState(false);
    const [manualLocationList, setManualLocationList] = useState([{}]);
    const [viewDim, setViewDim] = useState({width: 0, height: 0});
    const settingsService = SettingsService.getInstance();


    // @ts-ignore
    const onLayout=(event)=> {
        const {height, width} = event.nativeEvent.layout;
        setViewDim({width: width, height: height});
        locationSession.resyncLocationServices();
    }

    const onModalLayout=async ()=> {
        setManualLocationsLoading(true);
        let url = settingsService.getSettingValue("url") + "/api/getManualLocations";
        await fetch(url, {
            method: 'GET',
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + token?.current.token,
                'Accept': 'application/json'
            }
        }).then(res => res.json())
            .then(data => {
                let locationList = [{label: "Select one...", value: "none"}];
                for (let location of JSON.parse(data)) {
                    locationList.push({
                        label: location.name,
                        value: location.id
                    });
                }
                setManualLocationList(locationList);
                setManualLocationsLoading(false);
            });
    }


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
                            // @ts-ignore
                            "Authorization": "Bearer " + token?.current.token,
                        }
                    }}
                    onHttpError={(syntheticEvent) => {
                        console.log("onHttpError",syntheticEvent);
                    }}
                    cacheEnabled={false}
                    scrollEnabled={false}
                    cacheMode="LOAD_NO_CACHE"
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
                <Modal
                    animationType="slide"
                    transparent={false}
                    presentationStyle='pageSheet'
                    visible={locationSession.manualLocationModalVisible}
                    onRequestClose={() => {
                        locationSession.setManualLocationModalVisible(false);
                    }}>
                    <SafeAreaView
                        onLayout={onModalLayout}
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: Colors.background
                        }}
                    >
                        <ActivityIndicator
                            color={Colors.primary}
                            animating={manualLocationsLoading}
                        />
                        <ListItem key={"manualUpdate"}
                                  style={{
                                      width:275,
                                      height:40,
                                      backgroundColor: Colors.background
                                  }}>
                            <ListItem.Content>
                                <ListItem.Title>Manual Location Update</ListItem.Title>
                                <Dropdown
                                    style={{
                                        width:250,
                                        height:40,
                                        backgroundColor: Colors.background
                                    }}
                                    data={manualLocationList}
                                    disable={manualLocationsLoading}
                                    labelField="label"
                                    valueField="value"
                                    value={"none"}
                                    onChange={(selection) => {
                                        console.log(selection.value);
                                        let url = settingsService.getSettingValue("url") + "/api/updateUserLocationManual";
                                        fetch(url, {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                positionID: selection.value
                                            }),
                                            headers: {
                                                // @ts-ignore
                                                "Authorization": "Bearer " + token?.current.token,
                                                "Content-Type": "application/json",
                                            }

                                        });
                                        locationSession.setManualLocationModalVisible(false)
                                    }}
                                />
                            </ListItem.Content>
                        </ListItem>
                        <Button
                            mode="contained"
                            style={{marginTop: 30}}
                            buttonColor={Colors.primary}
                            textColor={Colors.background}
                            onPress={() => {
                                locationSession.setManualLocationModalVisible(false)
                            }}>
                            Close
                        </Button>
                    </SafeAreaView>
                </Modal>
            </SafeAreaView>
        </>
    )
}
