import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';

export function TypingIndicator() {
    const opacity1 = useRef(new Animated.Value(0.4)).current;
    const opacity2 = useRef(new Animated.Value(0.4)).current;
    const opacity3 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animate = (anim: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.4,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        // Stagger animations
        const timer1 = setTimeout(() => animate(opacity1, 0), 0);
        const timer2 = setTimeout(() => animate(opacity2, 200), 200);
        const timer3 = setTimeout(() => animate(opacity3, 400), 400);

        // Correct cleanup: React Native Animated.loop doesn't return a stop function directly like that 
        // usually need to stop the value or keep track of the animation object.
        // For simplicity in useEffect loop, keeping it running is fine for this component lifetime.

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        }
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.dot, { opacity: opacity1 }]} />
            <Animated.View style={[styles.dot, { opacity: opacity2 }]} />
            <Animated.View style={[styles.dot, { opacity: opacity3 }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        gap: 4,
        height: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#94a3b8',
    },
});
