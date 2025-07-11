import {useRouter} from 'expo-router';
import {Image as ExpoImage} from 'expo-image';
import {Appbar} from 'react-native-paper';
import {useAuthSession} from "@/providers/AuthService";
import React from "react";
import {SafeAreaView, View} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import Colors from "@/components/colorPalette";
import SettingsService from "@/providers/SettingsService";

export default function HomePage(){
    const {token, signOut} = useAuthSession();
    const locationSession = useLocationSession();
    const settingsService = SettingsService.getInstance();

    // @ts-ignore
    let tokenVal= token?.current.token;
    const pocketWatchUrl = settingsService.getSettingValue("url") + "/api/createPocketWatch";

    return (
        <>
            <SafeAreaView
                style={{
                    backgroundColor: Colors.background
                }}
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
                <View style={{flex:1}}>
                    <ExpoImage
                        style={{
                            flex: 1,
                            width: '100%',
                            height: '100%'
                        }}
                        source={{
                            uri: pocketWatchUrl,
                            headers: {
                                "Authorization": "Bearer " + tokenVal
                            },
                            width: 693,
                            height: 960
                        }}
                        onLoad={() => console.log("Pocketwatch loaded.")}
                        onError={() => console.log("Pocketwatch failed")}
                        onLoadStart={() => console.log("Pocketwatch started.")}
                        contentFit="contain"
                        contentPosition="center"
                        cachePolicy="memory-disk"

                    />
                </View>
            </SafeAreaView>
        </>
    )
}
