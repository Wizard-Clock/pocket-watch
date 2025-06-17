import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundGeolocation, {
    State,
    Location,
    Geofence,
    HttpEvent,
    MotionActivityEvent,
    ProviderChangeEvent,
    MotionChangeEvent,
    GeofenceEvent,
    GeofencesChangeEvent,
    HeartbeatEvent,
    ConnectivityChangeEvent
} from "@/components/geoloc";

import {Platform} from "react-native";

const STORAGE_KEY:string = "pocket-watch";

const APP_SETTINGS:any = [
    {name: 'username', group: 'application', dataType: 'string', inputType: 'text', defaultValue: ''},
];

const LOCATION_SETTINGS:any = {
    common: [
        // Geolocation
        {name: 'trackingMode', group: 'geolocation', dataType: 'integer', inputType: 'select', defaultValue: 1, values: [{label: 'Geofences only', value: 0}, {label: 'Location + Geofences', value: 1}]},
        {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
                {label: 'NAVIGATION', value: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION},
                {label: 'HIGH', value: BackgroundGeolocation.DESIRED_ACCURACY_HIGH},
                {label: 'MEDIUM', value: BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM},
                {label: 'LOW', value: BackgroundGeolocation.DESIRED_ACCURACY_LOW},
                {label: 'MINIMUM', value: BackgroundGeolocation.DESIRED_ACCURACY_VERY_LOW},
                {label: 'LOWEST', value: BackgroundGeolocation.DESIRED_ACCURACY_LOWEST}
            ], defaultValue: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION },
        {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
        {name: 'disableElasticity', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'elasticityMultiplier', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1, 2, 3, 5, 10], defaultValue: 1},
        {name: 'geofenceProximityRadius', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [1000, 1500, 2000, 5000, 10000, 100000], defaultValue: 1000 },
        {name: 'stopAfterElapsedMinutes', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [-1, 0, 1, 2, 5, 10, 15], defaultValue: 0},
        {name: 'desiredOdometerAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [10, 20, 50, 100, 500], defaultValue: 100},
        {name: 'useSignificantChangesOnly', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'disableLocationAuthorizationAlert', group: 'application', dataType: 'boolean', inputType: 'toggle', values: ['true', 'false'], defaultValue: 'false'},
        {name: 'showsBackgroundLocationIndicator', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        // Activity Recognition
        {name: 'stopTimeout', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 5, 10, 15], defaultValue: 1},
        {name: 'disableMotionActivityUpdates', group: 'activity recognition', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'disableStopDetection', group: 'activity recognition', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},

        // HTTP & Persistence
        {name: 'url', group: 'http', inputType: 'text', dataType: 'string', defaultValue: 'http://your.server.com'},
        {name: 'autoSync', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'disableAutoSyncOnCellular', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'autoSyncThreshold', group: 'http', dataType: 'integer', inputType: 'select', values: [0, 5, 10, 25, 50, 100], defaultValue: 0},
        {name: 'batchSync', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'maxBatchSize', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 50, 100, 250, 500], defaultValue: 250},
        {name: 'maxRecordsToPersist', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 0, 1, 10, 100, 1000], defaultValue: -1},
        {name: 'maxDaysToPersist', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 1, 2, 3, 5, 7, 14], defaultValue: 2},
        {name: 'persistMode', group: 'http', dataType: 'integer', inputType: 'select', values: [
                {label: 'PERSIST_MODE_ALL', value: 2},
                {label: 'PERSIST_MODE_LOCATION', value: 1},
                {label: 'PERSIST_MODE_GEOFENCE', value: -1},
                {label: 'PERSIST_MODE_NONE', value: 0},
            ], defaultValue: 2},
        // Application
        {name: 'stopOnTerminate', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'startOnBoot', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'heartbeatInterval', group: 'application', dataType: 'integer', inputType: 'select', values: [-1, 60, (2*60), (5*60), (15*60)], defaultValue: 60},
        // Logging & Debug
        {name: 'debug', group: 'debug', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'logLevel', group: 'debug', dataType: 'string', inputType: 'select', values:[
                {label: 'OFF', value: 0},
                {label: 'ERROR', value: 1},
                {label: 'WARN', value: 2},
                {label: 'INFO', value: 3},
                {label: 'DEBUG', value: 4},
                {label: 'VERBOSE', value: 5}
            ], defaultValue: 3},
        {name: 'logMaxDays', group: 'debug', dataType: 'integer', inputType: 'select', values: [1, 2, 3, 4, 5, 6, 7], defaultValue: 3}
    ],
    ios: [
        // Geolocation
        {name: 'stationaryRadius', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 25, 50, 100, 500, 1000, 5000], defaultValue: 25 },
        {name: 'activityType', group: 'geolocation', dataType: 'string', inputType: 'select', values: [
                {label: 'OTHER', value: BackgroundGeolocation.ACTIVITY_TYPE_OTHER},
                {label: 'AUTOMOTIVE_NAVIGATION',value: BackgroundGeolocation.ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION},
                {label: 'FITNESS', value: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS},
                {label: 'OTHER_NAVIGATION', value: BackgroundGeolocation.ACTIVITY_TYPE_OTHER_NAVIGATION}
            ], defaultValue: BackgroundGeolocation.ACTIVITY_TYPE_OTHER_NAVIGATION},
        // Application
        {name: 'preventSuspend', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        // Activity Recognition
        {name: 'stopDetectionDelay', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 5, 10, 15], defaultValue: 0}
    ],
    android: [
        // Geolocation
        {name: 'locationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 5000},
        {name: 'fastestLocationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [-1, 0, 1000, 5000, 10000, 30000, 60000], defaultValue: 1000},
        {name: 'deferTime', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, (10*1000), (30*1000), (60*1000), (5*60*1000)], defaultValue: 0},
        {name: 'geofenceModeHighAccuracy', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', value: [true, false], defaultValue: true},
        // Activity Recognition
        {name: 'motionTriggerDelay', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 10000, 30000, 60000], defaultValue: 0},
        //{name: 'triggerActivities', group: 'activity recognition', dataType: 'string', inputType: 'select', values: ['in_vehicle', 'on_bicycle', 'on_foot', 'running', 'walking'], defaultValue: 'in_vehicle, on_bicycle, running, walking, on_foot'},
        // Application
        {name: 'enableHeadless', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'notificationPriority', group: 'application', dataType: 'integer', inputType: 'select', values: [
                {label:'DEFAULT', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT},
                {label:'HIGH', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH},
                {label:'LOW', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_LOW},
                {label:'MAX', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_MAX},
                {label:'MIN', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_MIN}
            ], defaultValue: BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT}
    ]
};

let instance:any = null;

export default class SettingsService {
    static getInstance() {
        if (instance === null) {
            instance = new SettingsService({});
        }
        return instance;
    }

    private applicationState: any = null;
    private locationState: State;
    private changeBuffer: any = undefined;
    private readonly platform: string;
    private settings: any;

    constructor(props: any) {
        this._loadApplicationState();
        this.locationState = {
            odometer: 0,
            enabled: false,
            trackingMode: 1,
            schedulerEnabled: false,
            didLaunchInBackground: false,
            didDeviceReboot: false
        };

        this.settings = {
            items: [],
            map: {}
        };

        this.platform = Platform.OS.toLowerCase();

        let items;
        if (LOCATION_SETTINGS[this.platform]) {
            items = [].concat(LOCATION_SETTINGS.common).concat(LOCATION_SETTINGS[this.platform]);
        } else {
            items = [].concat(LOCATION_SETTINGS.common);
        }

        this.settings.items = items;
        // Create a Map of Settings for speedy lookup.
        items.forEach((item: any) => {
            this.settings.map[item.name] = item;
        });
    }

    getApplicationState(callback:Function) {
        if (this.applicationState) {
            callback(this.applicationState);
        } else {
            this._loadApplicationState(callback);
        }
    }

    getApplicationSettings(group:any) {
        if (group !== undefined) {
            return APP_SETTINGS.filter((setting:any) => { return setting.group === group; });
        } else {
            return APP_SETTINGS;
        }
    }

    getPlatform() {
        return this.platform;
    }

    getLocationSettings(group:string) {
        if (group === undefined) {
            return this.settings.items;
        } else {
            let settings:Array<any> = [];
            this.settings.items.forEach((setting:any) => {
                if (setting.group === group && !setting.ignore) {
                    settings.push(setting);
                }
            });
            return settings;
        }
    }

    getLocationState(callback:Function) {
        BackgroundGeolocation.getState((state:State) => {
            this.locationState = state;
            callback(state);
        });
    }

    /**
     * Determines if plugin is in location or geofences-only mode
     * @return {Boolean}
     */
    isLocationTrackingMode() {
        return (this.locationState.trackingMode === 1);
    }

    /**
     * Application settings change handler method used in SettingsView.  This method buffers change-events by 500ms.
     * When the buffer timer expires, the change will be persisted in AsyncStorage.
     * NOTE:  This is only for "application" settings -- not BackgroundGeolocation settings.
     * @param {Object} setting
     * @param {Mixed} value
     */
    onChange(setting:any, value:any) {
        if (typeof(setting) === 'string') {
            let name = setting;
            setting = APP_SETTINGS.find((item:any) => {
                return item.name === name
            });
            if (!setting) {
                console.warn('SettingsService#onChange failed to find setting: ', name);
                return;
            }
        }
        switch(setting.dataType) {
            case 'integer':
                value = parseInt(value, 10);
                break;
        }
        // Buffer field-changes by 500ms
        if (this.changeBuffer) {
            this.changeBuffer = clearTimeout(this.changeBuffer);
        }
        this.changeBuffer = setTimeout(() => {
            this.set(setting.name, value);
        }, 500);
    }

    /**
     * Sets and persists a single Application setting
     * @param {String} name
     * @param {Mixed} value
     */
    set(name:string, value:any) {
        if (this.applicationState[name] === value) {
            // No change.  Ignore
            return;
        }
        this.applicationState[name] = value;
        this._saveState();
    }

    /**
     * Returns the default application-settings {}
     * @return {Object}
     */
    _getDefaultState() {
        let state:any = {};
        APP_SETTINGS.forEach((setting:any) => {
            state[setting.name] = setting.defaultValue;
        });
        return state;
    }

    /**
     * Load the application-settings from AsyncStorage
     * @param {Function} callback
     */
    _loadApplicationState(callback?:Function) {
        AsyncStorage.getItem(STORAGE_KEY + ":settings", (err, value) => {
            if (value) {
                this.applicationState = JSON.parse(value);
            } else {
                this.applicationState = this._getDefaultState();
                this._saveState();
            }

            if (callback) {
                callback(this.applicationState);
            }
        });
    }

    /**
     * Persist the application settings to AsyncStorage
     */
    _saveState() {
        AsyncStorage.setItem(STORAGE_KEY + ":settings", JSON.stringify(this.applicationState, null));
    }
}