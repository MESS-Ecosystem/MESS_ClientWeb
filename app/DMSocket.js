'use client'
import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8080/DM';
let platforminfo = null
async function getPlatformInfo() {
    if (typeof window !== "undefined" && window.navigator.userAgentData) {
        let platforminfo = await window.navigator.userAgentData.getHighEntropyValues(['model', 'platform'])
            console.log('testinfo: ', platforminfo) // this works
            return platforminfo;
    }
    return null;
}
// let authparams = {
//     auth: {
//         platforminfo: getplatforminfo(), // this returns empty object on server' 
//         // platforminfofound: true
//     }
// }
export const socket = io(URL, {
    auth: async (callback) => {
        let info = await getPlatformInfo()
        callback({
            platformInfo: info,
        })
    },
    autoConnect: false,
});