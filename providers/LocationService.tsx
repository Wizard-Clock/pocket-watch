import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import SettingsService from "@/providers/SettingsService"
import {useAuthSession} from "@/providers/AuthService";
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from "expo-secure-store";

const settingsService = SettingsService.getInstance();
const WC_API_TOKEN_KEY = 'portkey';

const BACKGROUND_TASK_NAME = "DOBBY_TRACKING_SERVICE";
TaskManager.defineTask(BACKGROUND_TASK_NAME, async (event) => {
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

        await sendLocationToServer(tokenVal, mostRecentLocation, false);
    } catch (error) {
        return console.error('Failed to execute the background task:', error);
    }
});

const HEARTBEAT_TASK_NAME = "HORCRUX_HEARTBEAT_SERVICE";
TaskManager.defineTask(HEARTBEAT_TASK_NAME, async (event) => {
    try {
        if (event.error) {
            return console.error('[heartbeat]', 'Something went wrong within the background location task...', event.error);
        }
        console.log(`Got heartbeat task call at date: ${new Date(Date.now()).toISOString()}`);
        await Location.getCurrentPositionAsync({
            accuracy: settingsService.getSettingValue("desiredAccuracy"),
            timeInterval: settingsService.getSettingValue("timeInterval"),
            distanceInterval: settingsService.getSettingValue("distanceInterval")
        }).then(async (position) => {
            console.log(`[heartbeat] Location:`, position);
            let tokenVal = await SecureStore.getItemAsync(WC_API_TOKEN_KEY);
            await sendLocationToServer(tokenVal, position, true);
        });
    } catch (error) {
        console.error('Failed to execute the heartbeat task:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
    return BackgroundTask.BackgroundTaskResult.Success;
});

const LocationContext = createContext<{
    toggleLocationService: () => void,
    updateLocationConfig: () => void,
    sendLocationPing: () => void,
    resyncLocationServices: () => void,
    locationStarted: boolean,
    locationIcon: string,
    portalSnackbarVisible: boolean,
    portalSnackbarText: string,
    setPortalSnackbarVisible: (state:boolean) => void,
    manualLocationModalVisible: boolean,
    setManualLocationModalVisible: (state:boolean) => void
}>({
    toggleLocationService: () => null,
    updateLocationConfig: () => null,
    sendLocationPing: () => null,
    resyncLocationServices: () => null,
    locationStarted: false,
    locationIcon: "play-circle",
    portalSnackbarVisible: false,
    portalSnackbarText: '',
    setPortalSnackbarVisible: () => null,
    manualLocationModalVisible: false,
    setManualLocationModalVisible: () => null
});

// Access the context as a hook
export function useLocationSession() {
    return useContext(LocationContext);
}

async function sendLocationToServer(tokenVal: string | null, location: Location.LocationObject, isHeartbeat: boolean) {
    let url = settingsService.getSettingValue("url") + "/api/updateUserLocation";
    let response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            location: {
                "latitude": location.coords.latitude,
                "longitude": location.coords.longitude
            },
            heartbeat: isHeartbeat
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
    const [manualLocationModalVisible, setManualLocationModalVisible] = useState(false);
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
        if (settingsService.getSettingValue("locationReportingType") === "manual") {
            setLocationIcon("map-marker-down");
        } else {
            console.log("Sync location service state");
            Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK_NAME).then((result) => {setLocationServiceState(result, false)});
        }
    }

    const handleSnackbar= (isVisible:boolean, text:string) => {
        setPortalSnackbarVisible(isVisible);
        setPortalSnackbarText(text);
    }

    const handleLocationHeartbeat=(startService:boolean) => {
        if (settingsService.getSettingValue("enableHeartbeat")) {
            if (startService) {
                BackgroundTask.registerTaskAsync(HEARTBEAT_TASK_NAME, {
                    minimumInterval: settingsService.getSettingValue("minimumHeartbeatInterval")
                }).then(() => {
                    console.log("Horcrux Created: location heartbeat enabled every " + settingsService.getSettingValue("minimumHeartbeatInterval") + " minutes.");
                });
            } else {
                BackgroundTask.unregisterTaskAsync(HEARTBEAT_TASK_NAME).then(() => {
                    console.log("Horcrux Destroyed: location heartbeat disabled.");
                });
            }
        }
    }

    const toggleLocationService = () => {
        if (settingsService.getSettingValue("locationReportingType") === "manual") {
            setManualLocationModalVisible(true);
        } else {
            if (!TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
                console.log("Task is not defined");
                return;
            }

            console.log("Toggled location service");
            setLocationIcon('swap-horizontal-circle');
            Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK_NAME).then((isStarted) => {
                if (isStarted) {
                    handleSnackbar(true, "Stopping Location Reporting.");
                    handleLocationHeartbeat(false);
                    Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME)
                        .then(() => setLocationServiceState(false, true));
                } else {
                    handleSnackbar(true, "Starting Location Reporting.");
                    if (!Location.getBackgroundPermissionsAsync()) {
                        console.log("location tracking denied: background permission denied.");
                        Location.requestBackgroundPermissionsAsync();
                        setLocationServiceState(false, true);
                        return;
                    }
                    handleLocationHeartbeat(true);
                    Location.startLocationUpdatesAsync(BACKGROUND_TASK_NAME, {
                        accuracy: settingsService.getSettingValue("desiredAccuracy"),
                        timeInterval: settingsService.getSettingValue("timeInterval"),
                        distanceInterval: settingsService.getSettingValue("distanceInterval"),
                        showsBackgroundLocationIndicator: true,
                        foregroundService: {
                            notificationTitle: 'Dobby is Following',
                            notificationBody: 'Location tracking from Pocket Watch is happening in the background.',
                            killServiceOnDestroy: false
                        },
                    }).then(() => setLocationServiceState(true, true)).catch(e => console.error(e));
                }
            });
        }
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
        console.log('reportingMethod: ' + settingsService.getSettingValue("locationReportingType"));
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
                sendLocationToServer(token?.current.token, posResult, false);
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
                setPortalSnackbarVisible,
                manualLocationModalVisible,
                setManualLocationModalVisible,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}
