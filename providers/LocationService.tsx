import {createContext, ReactNode, useContext, useEffect, useState} from "react"
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsService from "@/providers/SettingsService"
const settingsService = SettingsService.getInstance();
import {useAuthSession} from "@/providers/AuthService";
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = "DOBBY_TRACKING_SERVICE";
// @ts-ignore
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data: { locations }, error }) => {
    try {
        const now = Date.now();
        console.log(`Got location task call at date: ${new Date(now).toISOString()}`);
        for (let location of locations) {
            console.log(`Got location task location of: ${location}`);
        }

        let tokenVal = await AsyncStorage.getItem("pocket-watch:token");
        console.log("tokenVal: "+ tokenVal);
        let url = settingsService.getSettingValue("url") + "/api/updateUserLocation";
        for (let location of locations) {
            let response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    location: {
                        // @ts-ignore
                        "latitude": location.coords.latitude,
                        // @ts-ignore
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
    } catch (error) {
        console.error('Failed to execute the background task:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
    return BackgroundTask.BackgroundTaskResult.Success;
});

const BACKGROUND_FETCH_NAME = "KREATURE_TRACKING_SERVICE"
TaskManager.defineTask(BACKGROUND_FETCH_NAME, async () => {
    try {
        const now = Date.now();
        console.log(`Got background task call at date: ${new Date(now).toISOString()}`);

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

export default function LocationProvider({children}:{children: ReactNode}): ReactNode {
    const {token} = useAuthSession();
    const [locationIcon, setLocationIcon] = useState('play-circle');
    const [locationStarted, setLocationStarted] = useState(false);

    useEffect(() => {
        const requestPermissions = async () => {
            try {
                await Location.requestForegroundPermissionsAsync();
                await Location.requestBackgroundPermissionsAsync();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        requestPermissions();
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

            // @ts-ignore
            let tokenVal= token?.current.token;
            console.log("tokenVal: "+ tokenVal);
            AsyncStorage.setItem("pocket-watch:token", tokenVal);
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
            }).then(() => setLocationServiceState(true));
        }
    }

    const setLocationServiceState = (value:boolean) => {
        setLocationStarted(value);
        setLocationIcon(value ? 'stop-circle' : 'play-circle');
        console.log('tracking started?', value);
    }

    const updateLocationConfig = () => {
        // @ts-ignore
        let tokenVal = token?.current.token;
        console.log('Update location config');
        console.log('desiredAccuracy: ' + settingsService.getSettingValue("desiredAccuracy"));
        console.log('timeInterval: ' + settingsService.getSettingValue("timeInterval"));
        console.log('distanceInterval: ' + settingsService.getSettingValue("distanceInterval"));
        console.log('url: ' + settingsService.getSettingValue("url") + "/api/updateUserLocation");
        // @ts-ignore
        console.log('Bearer: ' + tokenVal);
    }

    const sendLocationPing = async () => {
        console.log('Sending location ping to the server...');
        let position= await Location.getCurrentPositionAsync();
        console.log('position: ' + position);

        // @ts-ignore
        let tokenVal= token?.current.token;
        console.log("tokenVal: "+ tokenVal);

        const url = settingsService.getSettingValue("url") + "/api/updateUserLocation";
        let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                location: {
                    // @ts-ignore
                    "latitude": position.coords.latitude,
                    // @ts-ignore
                    "longitude": position.coords.longitude
                }
            }),
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + tokenVal
            }
        });
        console.log(response);
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
