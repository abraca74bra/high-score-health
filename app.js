import { db, auth, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, onSnapshot, Timestamp, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from './firebaseConfig.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            // Authentication
            isAuthenticated: false,
            authChecked: false,
            currentUser: null,
            userEmail: null,
            userDisplayName: null,
            email: '',
            password: '',
            displayName: '',
            isSignupMode: false,
            authError: null,
            showUserMenu: false,
            
            // App data
            headerTotal: null,
            activeTab: 'Earn',
            earnData: {},
            redeemData: {},
            historyData: {},
            historyUnsubscribe: null,
            customEntryMode: null,
            showCustomEntryModal: false,
            customEntryPointValue: null,
            customEntryMemo: '',
            showIndoor: true,
            showOutdoor: true,
            showActivityModal: false,
            selectedActivity: null,
            selectedActivityId: null,
            selectedQuantity: null,
            selectedIntensity: 1 // 0=Easy, 1=Moderate, 2=Intense
        }
    },
    async mounted() {
        // Set up authentication state listener
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                this.isAuthenticated = true;
                this.currentUser = user.uid;
                this.userEmail = user.email;
                
                // Load user data
                await this.loadHeaderTotal();
                await this.loadTabData();
                this.loadHistoryData();
            } else {
                // User is signed out
                this.isAuthenticated = false;
                this.currentUser = null;
                this.userEmail = null;
                this.userDisplayName = null;
            }
            this.authChecked = true;
        });
        
        // Close user menu when clicking outside
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        // Clean up event listener
        document.removeEventListener('click', this.handleClickOutside);
        // Clean up Firestore listener
        if (this.historyUnsubscribe) {
            this.historyUnsubscribe();
        }
    },
    methods: {
        async handleLogin() {
            this.authError = null;
            try {
                await signInWithEmailAndPassword(auth, this.email, this.password);
                // onAuthStateChanged will handle the rest
                this.email = '';
                this.password = '';
            } catch (error) {
                console.error('Login error:', error);
                this.authError = this.getAuthErrorMessage(error.code);
            }
        },
        async handleSignup() {
            this.authError = null;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
                // Initialize user document in Firestore
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: this.email,
                    displayName: this.displayName,
                    currentTotal: 0,
                    createdAt: Timestamp.now()
                });
                this.email = '';
                this.password = '';
                this.displayName = '';
            } catch (error) {
                console.error('Signup error:', error);
                this.authError = this.getAuthErrorMessage(error.code);
            }
        },
        async handleSignOut() {
            try {
                // Clean up history listener
                if (this.historyUnsubscribe) {
                    this.historyUnsubscribe();
                    this.historyUnsubscribe = null;
                }
                
                await signOut(auth);
                // Clear local data
                this.headerTotal = null;
                this.earnData = {};
                this.redeemData = {};
                this.historyData = {};
                this.userDisplayName = null;
            } catch (error) {
                console.error('Sign out error:', error);
            }
        },
        toggleAuthMode() {
            this.isSignupMode = !this.isSignupMode;
            this.authError = null;
            this.displayName = '';
        },
        toggleUserMenu() {
            this.showUserMenu = !this.showUserMenu;
        },
        handleClickOutside(event) {
            // Close menu if clicking outside the user menu container
            const userMenuContainer = event.target.closest('.user-selector-container');
            if (!userMenuContainer && this.showUserMenu) {
                this.showUserMenu = false;
            }
        },
        getAuthErrorMessage(errorCode) {
            switch (errorCode) {
                case 'auth/invalid-email':
                    return 'Invalid email address.';
                case 'auth/user-disabled':
                    return 'This account has been disabled.';
                case 'auth/user-not-found':
                    return 'No account found with this email.';
                case 'auth/wrong-password':
                    return 'Incorrect password.';
                case 'auth/email-already-in-use':
                    return 'An account with this email already exists.';
                case 'auth/weak-password':
                    return 'Password should be at least 6 characters.';
                case 'auth/invalid-credential':
                    return 'Invalid email or password.';
                default:
                    return 'An error occurred. Please try again.';
            }
        },
        async loadHeaderTotal() {
            if (!this.currentUser) return;
            
            try {
                const docRef = doc(db, 'users', this.currentUser);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    this.headerTotal = docSnap.data().currentTotal || 0;
                    this.userDisplayName = docSnap.data().displayName || this.userEmail;
                } else {
                    // Initialize if doesn't exist
                    this.headerTotal = 0;
                    this.userDisplayName = this.userEmail;
                    await setDoc(docRef, { 
                        currentTotal: 0,
                        email: this.userEmail,
                        displayName: this.userEmail,
                        createdAt: Timestamp.now()
                    });
                }
            } catch (error) {
                console.error('Error loading header total:', error);
                // Fallback to localStorage
                const runningTotal = localStorage.getItem('headerTotal');
                this.headerTotal = runningTotal ? parseFloat(runningTotal) : 0;
            }
        },
        async loadTabData() {
            try {
                this.earnData = await this.loadCollection('activities');
                this.redeemData = await this.loadCollection('rewards');
            } catch (error) {
                console.error('Error loading tab data:', error);
            }
        },
        loadHistoryData() {
            if (!this.currentUser) return;
            
            // Unsubscribe from previous listener if exists
            if (this.historyUnsubscribe) {
                this.historyUnsubscribe();
            }
            
            try {
                // Calculate date 30 days ago
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const historyRef = collection(db, 'users', this.currentUser, 'history');
                const q = query(
                    historyRef, 
                    where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
                    orderBy("timestamp", "desc")
                );
                
                // Set up real-time listener
                this.historyUnsubscribe = onSnapshot(q, (querySnapshot) => {
                    const data = {};
                    querySnapshot.forEach((doc) => {
                        data[doc.id] = doc.data();
                    });
                    this.historyData = data;
                }, (error) => {
                    console.error('Error loading history:', error);
                    this.historyData = {};
                });
            } catch (error) {
                console.error('Error setting up history listener:', error);
                this.historyData = {};
            }
        },
        async loadCollection(collectionName) {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const data = {};
                querySnapshot.forEach((doc) => {
                    data[doc.id] = doc.data();
                });
                return data;
            } catch (error) {
                console.error(`Error loading ${collectionName}:`, error);
                return {};
            }
        },
        openTab(tabName) {
            this.activeTab = tabName;
        },
        async addPoints(pointsToAdd, memo = '') {
            if (!this.currentUser) {
                alert('Error: No user selected. Please select a user first.');
                return;
            }
            
            this.headerTotal += pointsToAdd;
            
            // Save to Firestore and localStorage
            try {
                const docRef = doc(db, 'users', this.currentUser);
                await updateDoc(docRef, { currentTotal: this.headerTotal });
            } catch (error) {
                console.error('Error updating Firestore:', error);
            }
            localStorage.setItem("headerTotal", this.headerTotal);

            //Save memo and other details to history collection
            try {
                const historyRef = collection(db, 'users', this.currentUser, 'history');
                await addDoc(historyRef, {
                    headerTotal: this.headerTotal,
                    memo: memo,
                    pointsAdded: pointsToAdd,
                    timestamp: Timestamp.now()
                });
            } catch (error) {
                console.error('Error saving to history:', error);
            }
        },
        customEntry(){
            if(this.activeTab === 'Earn'){
                this.customEntryMode = 'Activity';
            } else if(this.activeTab === 'Redeem'){
                this.customEntryMode = 'Reward';
            //} else if(this.activeTab === 'Goals'){
            //} else if(this.activeTab === 'Achievements'){
            } else if(this.activeTab === 'History'){
                this.customEntryMode = 'Reset';
            } else {
                console.error('Unknown tab for custom entry');
                return;
            }
            this.showCustomEntryModal = true;
        },
        closeCustomEntryModal(){
            this.showCustomEntryModal = false;
            this.customEntryMode = null;
            this.customEntryPointValue = null;
            this.customEntryMemo = '';
        },
        addCustomPoints() {
            const pointsToAdd = Math.abs(parseFloat(this.customEntryPointValue));
            if (!pointsToAdd) {
                return;
            }
            const memo = "Custom: " + this.customEntryMemo || "No memo";
            this.addPoints(pointsToAdd, memo);

            this.closeCustomEntryModal();
        },
        subtractCustomPoints() {
            const pointsToSubtract = Math.abs(parseFloat(this.customEntryPointValue));
            if (!pointsToSubtract) {
                return;
            }
            const memo = "Custom: " + this.customEntryMemo || "No memo";
            this.addPoints(pointsToSubtract * -1, memo);
            this.closeCustomEntryModal();
        },
        async resetPoints() {
            if (!this.currentUser) return;
            
            const resetTotal = parseFloat(this.customEntryPointValue);
            if (!resetTotal && resetTotal !== 0) {
                return;
            }
            const memo = "Reset: " + this.customEntryMemo || "No memo";
            this.addPoints(resetTotal - this.headerTotal, memo);

            this.closeCustomEntryModal();
        },
        earnPreset(entryId) {
            const entry = this.earnData[entryId];
            if (entry && entry.pointsByUnit) {
                // Open modal for activity details
                this.selectedActivity = entry;
                this.selectedActivityId = entryId;
                // Auto-select the first quantity
                const quantities = Object.keys(entry.pointsByUnit);
                this.selectedQuantity = quantities.length > 0 ? parseInt(quantities[0]) : null;
                this.selectedIntensity = 1; // Default to Moderate
                this.showActivityModal = true;
            } else if (entry && entry.pointValue) {
                // Legacy: direct point value without options
                this.addPoints(entry.pointValue, this.selectedActivity.name);
            }
        },
        selectQuantity(quantity) {
            this.selectedQuantity = quantity;
        },
        closeActivityModal() {
            this.showActivityModal = false;
            this.selectedActivity = null;
            this.selectedActivityId = null;
            this.selectedQuantity = null;
            this.selectedIntensity = 1;
        },
        claimActivityPoints() {
            if (!this.selectedQuantity) return;
            
            this.addPoints(this.calculatedPoints, this.selectedActivity.name);
            this.closeActivityModal();
        },
        redeemPreset(entryId) {
            const entry = this.redeemData[entryId];
            if (entry && entry.pointValue) {
                this.addPoints(entry.pointValue * -1, entry.name);
            }
        }
    },
    computed: {
        filteredEarnData() {
            if (!this.earnData) return {};
            
            const filtered = {};
            for (const [id, activity] of Object.entries(this.earnData)) {
                const isOutdoor = activity.outdoors === true;
                const isIndoor = activity.outdoors === false;
                
                // Show if conditions match
                if ((isIndoor && this.showIndoor) || (isOutdoor && this.showOutdoor)) {
                    filtered[id] = activity;
                }
            }
            return filtered;
        },
        calculatedPoints() {
            if (!this.selectedActivity || !this.selectedQuantity) return 0;
            
            const basePoints = this.selectedActivity.pointsByUnit[this.selectedQuantity];
            
            if (this.selectedActivity.intensityModifier) {
                const intensityKeys = ["Easy", "Moderate", "Intense"];
                const intensityKey = intensityKeys[this.selectedIntensity];
                const modifier = this.selectedActivity.intensityModifier[intensityKey];
                return Math.round(basePoints * modifier);
            }
            
            return basePoints;
        }
    }
}).mount('#app');
