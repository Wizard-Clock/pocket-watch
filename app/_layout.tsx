import AuthProvider from "@/providers/AuthService";
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
