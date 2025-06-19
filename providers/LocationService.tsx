import {createContext, useContext, useEffect, useState} from "react"
import * as TaskManager from "expo-task-manager"
import * as Location from "expo-location"
import SettingsService from "@/providers/SettingsService"
import {Colors} from "@/providers/ColorService"

const LOCATION_TASK_NAME = "HOUSE_ELF_SERVICE";
const [position, setPosition] = useState(null);

const AuthContext = createContext<{
    startLocation: () => void
    stopLocation: () => void
    toggleLocationService: () => void
    locationStarted: boolean
    locationIcon: string;
}>({
    startLocation: () => null,
    stopLocation: () => null,
    toggleLocationService: () => null,
    locationStarted: false,
    locationIcon: "",
});

// Access the context as a hook
export function useLocationSession() {
    return useContext(AuthContext);
}

export default function LocationService() {
    const settingsService = SettingsService.getInstance();
    //Other options = stop-circle
    const [locationIcon, setLocationIcon] = useState('play-circle');
    const [locationStarted, setLocationStarted] = useState(false);

    useEffect(() => {
        const config = async () => {
            let foregroundPermission = await Location.requestForegroundPermissionsAsync();
            let backgroundPermission = await Location.requestBackgroundPermissionsAsync();
            if (foregroundPermission.status != 'granted' && backgroundPermission.status !== 'granted') {
                console.log('Permission to access location was denied');
            } else {
                console.log('Permission to access location granted');
            }
        };
        config();
    }, []);

    const startLocationTracking = async () => {
        if (settingsService.platform === "android") {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: settingsService.get("accuracy"),
                distanceInterval: settingsService.get("distanceInterval"),
                timeInterval: settingsService.get("timeInterval"),
                foregroundService: {
                    notificationTitle: "Pocket Watch",
                    notificationBody: "Dobby keeping tabs in background",
                    notificationColor: Colors.accent,
                }
            });
        } else if (settingsService.platform === "ios") {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: settingsService.get("accuracy"),
                distanceInterval: settingsService.get("distanceInterval"),
                showsBackgroundLocationIndicator: settingsService.get("showsBackgroundLocationIndicator"),
                foregroundService: {
                    notificationTitle: "Pocket Watch",
                    notificationBody: "Dobby keeping tabs in background",
                    notificationColor: Colors.accent,
                }
            });
        } else {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: settingsService.get("accuracy"),
                distanceInterval: settingsService.get("distanceInterval"),
                foregroundService: {
                    notificationTitle: "Pocket Watch",
                    notificationBody: "Dobby keeping tabs in background",
                    notificationColor: Colors.accent,
                }
            });
        }
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(
            LOCATION_TASK_NAME
        );
        setLocationServiceState(hasStarted);
    };

    const toggleLocationService = () => {
      if (locationStarted) {
          stopLocation();
      } else {
          startLocation();
      }
    }

    const startLocation = () => {
        startLocationTracking();
    }

    const stopLocation = () => {
        setLocationServiceState(false);
        TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)
            .then((tracking) => {
                if (tracking) {
                    Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                }
            })
    }

    const setLocationServiceState = (value:boolean) => {
        setLocationStarted(value);
        setLocationIcon(value ? 'play-circle' : 'stop-circle');
        console.log('tracking started?', value);
    }
}

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.log('LOCATION_TRACKING task ERROR:', error);
        return;
    }
    if (data) {
        // @ts-ignore
        const { locations } = data;
        let lat = locations[0].coords.latitude;
        let long = locations[0].coords.longitude;

        setPosition(locations[0]);

        // @ts-ignore
        console.log(`${new Date(Date.now()).toLocaleString()}: ${position.coords}`);
    }
});
