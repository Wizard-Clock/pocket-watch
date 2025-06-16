import {useRouter} from 'expo-router';
import {Appbar, Text} from 'react-native-paper';
import {useAuthSession} from "@/providers/Auth";
import React from "react";

export default function Home(){
    const router = useRouter();
    const {signOut} = useAuthSession();

    return (
        <>
            <Appbar.Header>
                <Appbar.Content title="Pocket Watch"/>
                <Appbar.Action icon="logout" onPress={signOut} />
                <Appbar.Action icon="cog" onPress={() => router.navigate('/settings')} />
            </Appbar.Header>
            <Text>Home BBY</Text>
        </>
    )
}
