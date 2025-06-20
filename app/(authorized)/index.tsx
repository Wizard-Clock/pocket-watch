import {useRouter} from 'expo-router';
import {Appbar, Text} from 'react-native-paper';
import {useAuthSession} from "@/providers/AuthService";
import React from "react";
import {SafeAreaView} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import Colors from "@/components/colorPalette";

export default function HomePage(){
    const {signOut} = useAuthSession();
    const locationSession = useLocationSession();

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
                <Text>Home BBY</Text>
            </SafeAreaView>
        </>
    )
}
