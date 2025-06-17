import {useRouter} from 'expo-router';
import {Appbar, Text} from 'react-native-paper';
import {useAuthSession} from "@/providers/AuthService";
import React from "react";
import {SafeAreaView} from "react-native";

export default function HomePage(){
    const {signOut} = useAuthSession();

    return (
        <>
            <SafeAreaView>
                <Appbar.Header>
                    <Appbar.Content title="Pocket Watch"/>
                    <Appbar.Action icon="logout" onPress={signOut} />
                    <Appbar.Action icon="cog" onPress={() => useRouter().navigate('/settings')} />
                </Appbar.Header>
                <Text>Home BBY</Text>
            </SafeAreaView>
        </>
    )
}
