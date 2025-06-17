import AuthProvider from "@/providers/Auth";
import {Slot} from "expo-router";
import {ReactNode, StrictMode} from "react";

export default function RootLayout(): ReactNode {
    return (
        <StrictMode>
            <AuthProvider>
                <Slot />
            </AuthProvider>
        </StrictMode>
    );
};
