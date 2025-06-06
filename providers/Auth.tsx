/*https://medium.com/@david.ryan.hall/setting-up-a-basic-login-flow-for-an-expo-application-0b62b2b3e448*/
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from "expo-router";
import {
    createContext,
    ReactNode,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import {fetch} from 'expo/fetch';

const AuthContext = createContext<{
    signIn: (arg0: string, user: { username: string; password: string }) => void;
    signOut: () => void
    token: RefObject<string | null> | null;
    isLoading: boolean
}>({
    signIn: () => null,
    signOut: () => null,
    token: null,
    isLoading: true
});

// Access the context as a hook
export function useAuthSession() {
    return useContext(AuthContext);
}

export default function AuthProvider({children}:{children: ReactNode}): ReactNode {
    const tokenRef = useRef<string|null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async ():Promise<void> => {
            const token = await AsyncStorage.getItem('@token');
            tokenRef.current = token || '';
            setIsLoading(false);
        })()
    }, []);

    const signIn = useCallback(async (url: string, user: { username: string; password: string }) => {
        console.log("hit");
        const response = await fetch(url+"/api/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (response.ok) {
            const token = await response.json();
            console.log('response', response);
            await AsyncStorage.setItem('@token', JSON.parse(token.json()));
            tokenRef.current = token;
            router.replace('/');
        } else {
            router.replace('/login');
        }
    }, []);

    const signOut = useCallback(async () => {
        await AsyncStorage.setItem('@token', '');
        tokenRef.current = null;
        router.replace('/login');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                token: tokenRef,
                isLoading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};