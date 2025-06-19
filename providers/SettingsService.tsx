import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from "react-native";
import * as Location from "expo-location";

const STORAGE_KEY:string = "pocket-watch";

const APP_SETTINGS:any = {
    common: [
        // Location manager accuracy. Pass one of Accuracy enum values.
        // For low-accuracies the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
        {name: 'accuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
                {label: 'Lowest', value: Location.Accuracy.Lowest,            description:'Accurate to the nearest three kilometers.'},
                {label: 'Lowest', value: Location.Accuracy.Low,               description:'Accurate to the nearest kilometer.'},
                {label: 'Lowest', value: Location.Accuracy.Balanced,          description:'Accurate to within one hundred meters.'},
                {label: 'Lowest', value: Location.Accuracy.High,              description:'Accurate to within ten meters of the desired target.'},
                {label: 'Lowest', value: Location.Accuracy.Highest,           description:'The best level of accuracy available.'}
            ], defaultValue: Location.Accuracy.High},
        // Receive updates only when the location has changed by at least this distance in meters. Default value may depend on accuracy option.
        {name: 'distanceInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0,10,50,100,150,200], defaultValue: 50},
],
    ios: [
        // A boolean indicating whether the status bar changes its appearance when location services are used in the background.
        {name: 'showsBackgroundLocationIndicator', group: 'notification', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    ],
    android: [
        // Minimum time to wait between each update in milliseconds. Default value may depend on accuracy option.
        {name: 'timeInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0,30,60,120,300,1800,3600], defaultValue: 120},
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

    private readonly platform: string;
    private appSettings: any;

    constructor(props: any) {
        this.platform = Platform.OS.toLowerCase();
        this._loadApplicationSettings();
    }

    /**
     * Sets and persists a single Application setting
     * @param {String} name
     * @param {Mixed} value
     */
    set(name:string, value:any) {
        if (this.appSettings[name] === value) {
            // No change.  Ignore
            return;
        }
        this.appSettings[name] = value;
        this._saveSettings();
    }

    /**
     * Sets and persists a single Application setting
     * @param {String} name
     * @param {Mixed} value
     */
    get(name:string) {
        return this.appSettings[name];
    }

    /**
     * Load the application-settings from AsyncStorage
     * @param {Function} callback
     */
    _loadApplicationSettings(callback?:Function) {
        AsyncStorage.getItem(STORAGE_KEY + ":settings", (err, value) => {
            if (value) {
                this.appSettings = JSON.parse(value);
            } else {
                this.appSettings = this._getDefaultSettings();
                this._saveSettings();
            }

            if (callback) {
                callback(this.appSettings);
            }
        });
    }

    /**
     * Returns the default application-settings {}
     * @return {Object}
     */
    _getDefaultSettings(): object {
        let state:any = {};
        const items = [].concat(APP_SETTINGS.common).concat(APP_SETTINGS[this.platform]);
        items.forEach((setting:any) => {
            state[setting.name] = setting.defaultValue;
        });
        return state;
    }

    /**
     * Persist the application settings to AsyncStorage
     */
    _saveSettings() {
        AsyncStorage.setItem(STORAGE_KEY + ":settings", JSON.stringify(this.appSettings, null));
    }
}