import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import SettingsService from "@/providers/SettingsService"
const settingsService = SettingsService.getInstance();
import {useAuthSession} from "@/providers/AuthService";
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from "expo-secure-store";
import Colors from "@/components/colorPalette";

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
        console.log('[tracking]', 'Received new locations');

        // Sort location list based of newest location first
        locations.sort((a, b) => b.timestamp - a.timestamp);
        let mostRecentLocation = locations[0];
        console.log(`[tracking] Location:`, mostRecentLocation);

        let tokenVal = await SecureStore.getItemAsync(WC_API_TOKEN_KEY);

        await sendLocationToServer(tokenVal, mostRecentLocation);
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
    resyncLocationServices: () => void
    locationStarted: boolean
    locationIcon: string
    portalSnackbarVisible: boolean
    portalSnackbarText: string
    setPortalSnackbarVisible: (state:boolean) => void;
}>({
    toggleLocationService: () => null,
    updateLocationConfig: () => null,
    sendLocationPing: () => null,
    resyncLocationServices: () => null,
    locationStarted: false,
    locationIcon: "play-circle",
    portalSnackbarVisible: false,
    portalSnackbarText: '',
    setPortalSnackbarVisible: () => null
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
    console.log(response.status);
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
    const [portalSnackbarVisible, setPortalSnackbarVisible] = useState(false);
    const [portalSnackbarText, setPortalSnackbarText] = useState("");

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

    const resyncLocationServices = () => {
        console.log("Sync location service state");
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then((result) => {setLocationServiceState(result, false)});
    }

    const handleSnackbar= (isVisible:boolean, text:string) => {
        setPortalSnackbarVisible(isVisible);
        setPortalSnackbarText(text);
    }

    const toggleLocationService = () => {
        if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
            console.log("Task is not defined");
            return;
        }

        console.log("Toggled location service");
        setLocationIcon('swap-horizontal-circle');
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then((isStarted) => {
            if (isStarted) {
                handleSnackbar(true, "Stopping Location Reporting.");
                Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
                    .then(() => setLocationServiceState(false, true));
            } else {
                handleSnackbar(true, "Starting Location Reporting.");
                if (!Location.getBackgroundPermissionsAsync()) {
                    console.log("location tracking denied: background permission denied.");
                    Location.requestBackgroundPermissionsAsync();
                    setLocationServiceState(false, true);
                    return;
                }

                Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                    accuracy: settingsService.getSettingValue("desiredAccuracy"),
                    timeInterval: settingsService.getSettingValue("timeInterval"),
                    distanceInterval: settingsService.getSettingValue("distanceInterval"),
                    showsBackgroundLocationIndicator: true,
                    foregroundService: {
                        notificationTitle: 'Dobby is Following',
                        notificationBody: 'Location tracking from Pocket Watch is happening in the background.',
                        notificationColor: Colors.primary,
                        killServiceOnDestroy: false
                    },
                }).then(() => setLocationServiceState(true, true)).catch(e => console.error(e));
            }
        });
    }

    const setLocationServiceState = (value:boolean, effectSnackbar:boolean) => {
        setLocationStarted(value);
        setTimeout(() => {
            setLocationIcon(value ? 'stop-circle' : 'play-circle');
        }, 1000);

        if (effectSnackbar) {
            setPortalSnackbarVisible(false);
            let snackText = "Location Reporting successfully " + (value ? "started." : "stopped.");
            handleSnackbar(true, snackText);

            setTimeout(() => {
                handleSnackbar(false, "");
            }, 3000);
        }
        console.log('tracking started?', value);
    }

    const updateLocationConfig = () => {
        console.log('Update location config');
        console.log('desiredAccuracy: ' + settingsService.getSettingValue("desiredAccuracy"));
        console.log('timeInterval: ' + settingsService.getSettingValue("timeInterval"));
        console.log('distanceInterval: ' + settingsService.getSettingValue("distanceInterval"));
        console.log('url: ' + settingsService.getSettingValue("url") + "/api/updateUserLocation");
        // @ts-ignore
        console.log('Bearer: ' + token?.current.token);
    }

    const sendLocationPing = async () => {
        await Location.getLastKnownPositionAsync().then(posResult => {
            console.log("getLastKnownPositionAsync", posResult);
            if (posResult) {
                console.log('Sending location ping to the server...');
                // @ts-ignore
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
                resyncLocationServices,
                locationStarted,
                locationIcon,
                portalSnackbarVisible,
                portalSnackbarText,
                setPortalSnackbarVisible
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}
