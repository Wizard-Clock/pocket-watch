import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
    return (
    <Tabs
        screenOptions={{
            tabBarActiveTintColor: '#F1EDE4',
            headerStyle: {
                backgroundColor: '#CF8E56',
            },
            headerShadowVisible: false,
            headerTintColor: '#864622',
            tabBarStyle: {
                backgroundColor: '#CF8E56',
            },
        }}
    >
        <Tabs.Screen name="index" options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'stopwatch-sharp' : 'stopwatch-outline'} color={color} size={24} />
            ),
        }} />
        <Tabs.Screen name="settings" options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={'settings-sharp'} color={color} size={24}/>
            ),
        }} />
    </Tabs>
    );
}
