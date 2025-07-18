import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import SettingsService from "@/providers/SettingsService"
const settingsService = SettingsService.getInstance();
import {useAuthSession} from "@/providers/AuthService";
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from "expo-secure-store";

const LOCATION_TASK_NAME = "DOBBY_TRACKING_SERVICE";
const WC_API_TOKEN_KEY = 'portkey';
TaskManager.defineTask(LOCATION_TASK_NAME, async (event) => {
    if (event.error) {
        return console.error('[tracking]', 'Something went wrong within the background location task...', event.error);
    }
    try {
        const now = Date.now();
        console.log(`Got location task call at date: ${new Date(now).toISOString()}`);

        const locations = (event.data as any).locations as Location.LocationObject[];
        console.log('[tracking]', 'Received new locations', locations);

        let tokenVal = await SecureStore.getItemAsync(WC_API_TOKEN_KEY);
        for (let location of locations) {
            await sendLocationToServer(tokenVal, location);
        }
    } catch (error) {
        console.error('Failed to execute the background task:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
    return BackgroundTask.BackgroundTaskResult.Success;
});

const LocationContext = createContext<{
    toggleLocationService: () => void
    updateLocationConfig: () => void
    sendLocationPing: () => void
    locationStarted: boolean
    locationIcon: string;
}>({
    toggleLocationService: () => null,
    updateLocationConfig: () => null,
    sendLocationPing: () => null,
    locationStarted: false,
    locationIcon: "play-circle",
});

// Access the context as a hook
export function useLocationSession() {
    return useContext(LocationContext);
}

async function sendLocationToServer(tokenVal: string | null, location: Location.LocationObject) {
    let url = settingsService.getSettingValue("url") + "/api/updateUserLocation";
    let response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            location: {
                "latitude": location.coords.latitude,
                "longitude": location.coords.longitude
            }
        }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tokenVal
        }
    });
    console.log(response);
}

async function sendServerHealthCheck() {
    let url = settingsService.getSettingValue("url") + "/api/health";
    let response = await fetch(url, {
        method: 'GET',
    });
    console.log(response);
}

export default function LocationProvider({children}:{children: ReactNode}): ReactNode {
    const {token} = useAuthSession();
    const [locationIcon, setLocationIcon] = useState('play-circle');
    const [locationStarted, setLocationStarted] = useState(false);

    useEffect(() => {
        const requestPermAndNotif = async () => {
            try {
                await Location.requestForegroundPermissionsAsync();
                await Location.requestBackgroundPermissionsAsync();
                await Notifications.requestPermissionsAsync();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        requestPermAndNotif();
    });

    const toggleLocationService = () => {
        console.log("Toggled location service");
        if (locationStarted) {
            Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
                .then(() => setLocationServiceState(false));
        } else {
            if (!Location.getBackgroundPermissionsAsync()) {
                console.log("location tracking denied");
                Location.requestBackgroundPermissionsAsync();
                return;
            }

            const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
            if (!isTaskDefined) {
                console.log("Task is not defined");
                return;
            }

            Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: settingsService.getSettingValue("desiredAccuracy"),
                timeInterval: settingsService.getSettingValue("timeInterval"),
                distanceInterval: settingsService.getSettingValue("distanceInterval"),
                showsBackgroundLocationIndicator: true, // iOS only.  Shows a blue bar when in background.  Requires background location capability in iOS.
                foregroundService: {
                    notificationTitle: 'Dobby is Following',
                    notificationBody: 'Location tracking from Pocket Watch is happening in the background.',
                    killServiceOnDestroy: false
                },
            }).then(() => setLocationServiceState(true)).catch(e => console.error(e));
        }
    }

    const setLocationServiceState = (value:boolean) => {
        setLocationStarted(value);
        setLocationIcon(value ? 'stop-circle' : 'play-circle');
        console.log('tracking started?', value);
    }

    const updateLocationConfig = () => {
        console.log('Update location config');
        console.log('desiredAccuracy: ' + settingsService.getSettingValue("desiredAccuracy"));
        console.log('timeInterval: ' + settingsService.getSettingValue("timeInterval"));
        console.log('distanceInterval: ' + settingsService.getSettingValue("distanceInterval"));
        console.log('url: ' + settingsService.getSettingValue("url") + "/api/updateUserLocation");
        console.log('Bearer: ' + token?.current.token);
    }

    const sendLocationPing = async () => {
        await Location.getLastKnownPositionAsync().then(posResult => {
            console.log("getLastKnownPositionAsync", posResult);
            if (posResult) {
                console.log('Sending location ping to the server...');
                sendLocationToServer(token?.current.token, posResult);
            } else {
                console.log('No last known location, sending health check instead.');
                sendServerHealthCheck();
            }
        });
    }

    return (
        <LocationContext.Provider
            value={{
                toggleLocationService,
                updateLocationConfig,
                sendLocationPing,
                locationStarted,
                locationIcon
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}
