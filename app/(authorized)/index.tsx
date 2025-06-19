import {useRouter} from 'expo-router';
import {Appbar, Text} from 'react-native-paper';
import {useAuthSession} from "@/providers/AuthService";
import React from "react";
import {SafeAreaView} from "react-native";
import {useLocationSession} from "@/providers/LocationService";

export default function HomePage(){
    const {signOut} = useAuthSession();
    const locationSession = useLocationSession();

    return (
        <>
            <SafeAreaView>
                <Appbar.Header>
                    <Appbar.Action
                        icon={locationSession.locationIcon}
                        onPress={locationSession.toggleLocationService}
                        isLeading={true}
                    />
                    <Appbar.Content title="Pocket Watch"/>
                    <Appbar.Action icon="logout" onPress={signOut} />
                    <Appbar.Action icon="cog" onPress={() => useRouter().navigate('/settings')} />
                </Appbar.Header>
                <Text>Home BBY</Text>
            </SafeAreaView>
        </>
    )
}
