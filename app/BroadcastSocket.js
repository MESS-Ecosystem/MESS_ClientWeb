'use client'
import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : `${process.env.NEXT_PUBLIC_SERVER_API_URL}/`;


// async function getPlatformInfo() {
//     if (typeof window !== "undefined" && window.navigator.userAgentData) {
//         let platforminfo = await window.navigator.userAgentData.getHighEntropyValues(['model', 'platform'])
//             console.log('testinfo: ', platforminfo) // this works
//             return platforminfo;
//     }
//     return null;
// }

function getPlatformInfo() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    console.log(platform)
    if (/Mac/i.test(platform)) return 'Mac OS';
    if (/iPhone|iPad|iPod/i.test(platform)) return 'iOS';
    if (/Win/i.test(platform)) return 'Windows';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/Linux/i.test(platform)) return 'Linux';
    return 'Unknown';
}

// let authparams = {
//     auth: {
//         platforminfo: getplatforminfo(), // this returns empty object on server' 
//         // platforminfofound: true
//     }
// }
export const socket = io(URL, {
    auth: (callback) => {
        let info = getPlatformInfo()
        callback({
            platformInfo: info,
        })
    },
    autoConnect: false,
});
