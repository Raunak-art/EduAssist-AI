// Firebase integration has been disabled.
// To enable real authentication, restore the Firebase config and SDK initialization here.

export const checkFirebaseConfig = () => {
    throw new Error("Firebase is disabled. Please use simulated login.");
};

export const signInWithGoogle = async () => {
    throw new Error("Firebase is disabled. Please use simulated login.");
};

export const signInWithApple = async () => {
    throw new Error("Firebase is disabled. Please use simulated login.");
};