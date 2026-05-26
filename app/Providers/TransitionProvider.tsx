'use client';

import gsap from "gsap";
import { TransitionRouter } from "next-transition-router";
import React, { useEffect, useRef, useState } from "react";


export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
    let pathRef = useRef<SVGPathElement | null>(null);
    let [totalLength, setTotalLength] = useState(550.7265014648438);
    useEffect(() => {
        if (pathRef.current) {
            setTotalLength(pathRef.current.getTotalLength())
        }
    }, [totalLength])
    return (
        <>
            <TransitionRouter
                leave={(next) => {
                    setTotalLength(0)
                    const tween = gsap.fromTo('#path_animator path', {
                        attr: { 'stroke-dashoffset': totalLength.toString() },
                        autoRound: false,
                    }, {
                        autoRound: false,
                        attr: { 'stroke-dashoffset': '0', 'stroke-width': '60' },
                        duration: 0.5,
                        ease: 'power1.in',
                        onComplete: next,
                    })
                    return () => tween.kill();
                }}
                enter={(next) => {
                    if (pathRef.current) setTotalLength(pathRef.current.getTotalLength())
                    const tween = gsap.fromTo('#path_animator path', {
                        autoRound: false,
                        attr: { 'stroke-dashoffset': '0' },
                    }, {
                        autoRound: false,
                        attr: { 'stroke-dashoffset': `-${totalLength.toString()}`, 'stroke-width': '0' },
                        duration: 0.5,
                        delay: 0.2,
                        ease: 'power2.out',
                        onComplete: next,
                    })
                    return () => tween.kill();
                }}
            >
                <svg id="path_animator" className='fixed top-0 left-0 z-50 pointer-events-none scale-135' width="100vw" height="100vh" viewBox="0 0 164 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path ref={pathRef} d="M58.786 1.00026C50.1968 4.58328 41.6075 8.1663 35.3412 11.0443C29.0749 13.9224 25.3919 15.9868 26.1182 17.4792C26.8445 18.9716 32.0919 19.8294 56.3033 20.2712C80.5148 20.7131 123.531 20.7131 146.063 20.9454C168.595 21.1777 169.339 21.6424 142.912 23.9825C116.484 26.3227 62.8636 30.5243 31.4615 36.9834C0.0593185 43.4425 -7.49945 52.0318 10.8152 56.6566C29.1298 61.2814 73.5469 61.6816 96.5365 62.3315C119.526 62.9813 119.742 63.8688 105.948 67.2271C92.1542 70.5854 64.3434 76.3876 49.1554 79.6818C33.9674 82.976 32.2449 83.5864 32.2782 83.735C34.1528 83.5518 36.5017 83.3753 37.3673 83.7633C37.7811 83.986 38.1434 84.2611 38.5166 84.5445"
                        stroke="whitesmoke"
                        strokeWidth="0"
                        strokeDasharray={totalLength}
                        strokeDashoffset={totalLength.toString()}
                        strokeLinecap="round" />
                </svg>
                {children}
            </TransitionRouter>
        </>
    );
}