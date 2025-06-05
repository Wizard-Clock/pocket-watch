import AuthProvider from "@/providers/Auth";
import {Slot} from "expo-router";
import {ReactNode} from "react";

export default function RootLayout(): ReactNode {
    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    );
};
