import {createContext, ReactNode, useContext, useEffect, useState} from "react"
import SettingsService from "@/providers/SettingsService"
import {useAuthSession} from "@/providers/AuthService";
import BackgroundGeolocation, { Subscription } from "react-native-background-geolocation";
import BackgroundFetch from "react-native-background-fetch";

const LOCATION_TASK_NAME = "HOUSE_ELF_SERVICE";

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
    const settingsService = SettingsService.getInstance();
    const {token} = useAuthSession();
    const [locationIcon, setLocationIcon] = useState('play-circle');
    const [locationStarted, setLocationStarted] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [position, setPosition] = useState('');

    useEffect(() => {
        const onLocation:Subscription = BackgroundGeolocation.onLocation((location) => {
            console.log('[onLocation]', location);
            setPosition(JSON.stringify(location, null, 2));
        })

        BackgroundGeolocation.ready({
            // Geolocation Config
            desiredAccuracy: settingsService.getSettingValue("desiredAccuracy"),
            distanceFilter: settingsService.getSettingValue("distanceFilter"),
            // Application config
            debug: settingsService.getSettingValue("debug"), // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: settingsService.getSettingValue("logLevel"),
            stopOnTerminate: settingsService.getSettingValue("stopOnTerminate"),   // <-- Allow the background-service to continue tracking when user closes the app.
            startOnBoot: settingsService.getSettingValue("startOnBoot"),        // <-- Auto start tracking when device is powered-up.
            enableHeadless: settingsService.getSettingValue("enableHeadless"),
            preventSuspend: true,
            heartbeatInterval: settingsService.getSettingValue("heartbeatInterval"),
            // HTTP / SQLite config
            url: settingsService.getSettingValue("url") + "/api/updateUserLocation",
            headers: {              // <-- Optional HTTP headers
                "Content-Type": "application/x-www-form-urlencoded",
                "authorization": "bearer " + token
            },
            locationTemplate: '{Location: {"latitude":<%= latitude %>,"longitude":<%= longitude %>}}',
            // Authorization
            locationAuthorizationRequest: 'Always',
            backgroundPermissionRationale: {
                title: "Allow access to this device's location in the background?",
                message: "In order to allow your house elf to follow you, please enable 'Allow all the time permission",
                positiveAction: "Change to Allow all the time"
            }
        }).then((state) => {
            setEnabled(state.enabled)
            console.log("- BackgroundGeolocation is configured and ready: ", state.enabled);
        });

        const heartbeatSubscriber:any = BackgroundGeolocation.onHeartbeat(async (event) => {
            const taskId = await BackgroundGeolocation.startBackgroundTask();
            try {
                const location = await BackgroundGeolocation.getCurrentPosition({
                    samples: 2,
                    timeout: 10,
                    extras: {
                        "event": "heartbeat"
                    }
                });
                console.log('[heartbeat] getCurrentPosition', location);
            } catch(error) {
                console.log('[getCurrentPosition] ERROR: ', error);
            }
            BackgroundGeolocation.stopBackgroundTask(taskId);
        });

        initBackgroundFetch();
        return () => {
            // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
            // during development live-reload.  Without this, event-listeners will accumulate with
            // each refresh during live-reload.
            onLocation.remove();
        }
    }, []);

    const initBackgroundFetch = async() => {
        BackgroundFetch.configure({
            minimumFetchInterval: 15,
            enableHeadless: true,
            stopOnTerminate: false
        }, async (taskId) => {
            console.log('[BackgroundFetch]', taskId);
            const location = await BackgroundGeolocation.getCurrentPosition({
                extras: {
                    "event": "background-fetch"
                },
                maximumAge: 10000,
                persist: true,
                timeout: 30,
                samples: 2
            });
            console.log('[getCurrentPosition]', location);
            BackgroundFetch.finish(taskId);
        }, async (taskId) => {
            console.log('[BackgroundFetch] TIMEOUT:', taskId);
            BackgroundFetch.finish(taskId);
        });
    }

    const toggleLocationService = () => {
        console.log("Toggle location service");
        if (locationStarted) {
            BackgroundGeolocation.stop();
            setLocationServiceState(false);
        } else {
            BackgroundGeolocation.start();
            setLocationServiceState(true);
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
        console.log('distanceFilter: ' + settingsService.getSettingValue("distanceFilter"));
        console.log('debug: ' + settingsService.getSettingValue("debug"));
        console.log('logLevel: ' + settingsService.getSettingValue("logLevel"));
        console.log('stopOnTerminate: ' + settingsService.getSettingValue("stopOnTerminate"));
        console.log('startOnBoot: ' + settingsService.getSettingValue("startOnBoot"));
        console.log('enableHeadless: ' + settingsService.getSettingValue("enableHeadless"));
        console.log('heartbeatInterval: ' + settingsService.getSettingValue("heartbeatInterval"));
        console.log('url: ' + settingsService.getSettingValue("url") + "/api/updateUserLocation");
        console.log('bearer: ' + token);


        BackgroundGeolocation.setConfig({
            // Geolocation Config
            desiredAccuracy: settingsService.getSettingValue("desiredAccuracy"),
            distanceFilter: settingsService.getSettingValue("distanceFilter"),
            // Application config
            debug: settingsService.getSettingValue("debug"), // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: settingsService.getSettingValue("logLevel"),
            stopOnTerminate: settingsService.getSettingValue("stopOnTerminate"),   // <-- Allow the background-service to continue tracking when user closes the app.
            startOnBoot: settingsService.getSettingValue("startOnBoot"),        // <-- Auto start tracking when device is powered-up.
            enableHeadless: settingsService.getSettingValue("enableHeadless"),
            heartbeatInterval: settingsService.getSettingValue("heartbeatInterval"),
            // HTTP / SQLite config
            url: settingsService.getSettingValue("url") + "/api/updateUserLocation",
            headers: {              // <-- Optional HTTP headers
                "Content-Type": "application/x-www-form-urlencoded",
                "bearer": token
            },
            locationTemplate: '{Location: {"latitude":<%= latitude %>,"longitude":<%= longitude %>}}',
            // Authorization
            locationAuthorizationRequest: 'Always',
            backgroundPermissionRationale: {
                title: "Allow access to this device's location in the background?",
                message: "In order to allow your house elf to follow you, please enable 'Allow all the time permission",
                positiveAction: "Change to Allow all the time"
            }
        }).then(result => console.log("- BackgroundGeolocation configuration updated"));
    }

    const sendLocationPing = () => {
        BackgroundGeolocation.getCurrentPosition({
            timeout: 10,          // 30 second timeout to fetch location
            maximumAge: 5000,     // Accept the last-known-location if not older than 5000 ms.
            desiredAccuracy: 10,  // Try to fetch a location with an accuracy of `10` meters.
        }).then(value => {console.log(value)});
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
