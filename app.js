import { db, auth, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, onSnapshot, Timestamp, increment, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from './firebaseConfig.js';

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
            selectedIntensity: 1, // 0=Easy, 1=Moderate, 2=Intense
            processingAction: false,
            trackingMetric: 'weight',
            trackingInput: null,
            trackingDateRange: 30,
            dateRangeOptions: [
                { value: 30, label: '30 Days' },
                { value: 90, label: '90 Days' },
                { value: 180, label: '6 Months' },
                { value: 365, label: '1 Year' }
            ],
            trackingData: [],
            trackingChart: null
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
                await this.loadTrackingData();
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
        // Clean up chart
        if (this.trackingChart) {
            this.trackingChart.destroy();
        }
    },
    methods: {
        async handleLogin() {
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            this.processingAction = true;
            this.authError = null;
            try {
                await signInWithEmailAndPassword(auth, this.email, this.password);
                // onAuthStateChanged will handle the rest
                this.email = '';
                this.password = '';
            } catch (error) {
                console.error('Login error:', error);
                this.authError = this.getAuthErrorMessage(error.code);
            } finally {
                this.processingAction = false;
            }
        },
        async handleSignup() {
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            this.processingAction = true;
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
            } finally {
                this.processingAction = false;
            }
        },
        async handleSignOut() {
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            this.processingAction = true;
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
            } finally {
                this.processingAction = false;
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
        async updateActivityPresetUsage(entryId) {
            if (!entryId) return;

            try {
                const activityRef = doc(db, 'activities', entryId);
                await updateDoc(activityRef, {
                    timesUsed: increment(1),
                    lastUsed: Timestamp.now()
                });
            } catch (error) {
                console.error(`Error updating activity preset usage for ${entryId}:`, error);
            }
        },
        customEntry() {
            if (this.activeTab === 'Earn') {
                this.customEntryMode = 'Activity';
            } else if (this.activeTab === 'Redeem') {
                this.customEntryMode = 'Reward';
                //} else if(this.activeTab === 'Goals'){
                //} else if(this.activeTab === 'Achievements'){
            } else if (this.activeTab === 'History') {
                this.customEntryMode = 'Reset';
            } else {
                console.error('Unknown tab for custom entry');
                return;
            }
            this.showCustomEntryModal = true;
        },
        closeCustomEntryModal() {
            this.showCustomEntryModal = false;
            this.customEntryMode = null;
            this.customEntryPointValue = null;
            this.customEntryMemo = '';
        },
        async addCustomPoints() {
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            const pointsToAdd = Math.abs(parseFloat(this.customEntryPointValue));
            if (!pointsToAdd) {
                return;
            }
            this.processingAction = true;
            try {
                const memo = "Custom: " + this.customEntryMemo || "No memo";
                await this.addPoints(pointsToAdd, memo);
            } catch (error) {
                console.error('Error adding custom points:', error);
                alert('Failed to add custom activity points. Please try again.');
            } finally {
                this.closeCustomEntryModal();
                this.processingAction = false;
            }
        },
        async subtractCustomPoints() {
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            const pointsToSubtract = Math.abs(parseFloat(this.customEntryPointValue));
            if (!pointsToSubtract) {
                return;
            }
            this.processingAction = true;
            try {
                const memo = "Custom: " + this.customEntryMemo || "No memo";
                await this.addPoints(pointsToSubtract * -1, memo);
            } catch (error) {
                console.error('Error subtracting custom points:', error);
                alert('Failed to redeem custom reward points. Please try again.');
            } finally {
                this.closeCustomEntryModal();
                this.processingAction = false;
            }
        },
        async resetPoints() {
            if (!this.currentUser) return;
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            }

            const resetTotal = parseFloat(this.customEntryPointValue);
            if (!resetTotal && resetTotal !== 0) {
                return;
            }
            this.processingAction = true;
            try {
                const memo = "Reset: " + this.customEntryMemo || "No memo";
                await this.addPoints(resetTotal - this.headerTotal, memo);
            } catch (error) {
                console.error('Error resetting points:', error);
                alert('Failed to reset points. Please try again.');
            } finally {
                this.closeCustomEntryModal();
                this.processingAction = false;
            }
        },
        async earnPreset(entryId) {
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
                // Point addition occurs when the user claims the specific point value
                // in the modal
            } 
            else {
                if(!entry){
                    alert('Error: Activity configuration not found. Please contact support.');
                } 
                else if(!entry.pointValue) {
                    alert('Error: No point values by unit are defined for this activity. Please contact support.');
                }
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
        async claimActivityPoints() {
            if (!this.selectedQuantity) return;
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            }

            this.processingAction = true;
            try {
                await this.addPoints(this.calculatedPoints, this.selectedActivity.name);
                await this.updateActivityPresetUsage(this.selectedActivityId);
            } catch (error) {
                console.error('Error claiming activity points:', error);
                alert('Failed to claim activity points. Please try again.');
            } finally {
                this.closeActivityModal();
                this.processingAction = false;
            }
        },
        async redeemPreset(entryId) {
            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            const entry = this.redeemData[entryId];
            if (entry && entry.pointValue) {
                this.processingAction = true;
                try {
                    await this.addPoints(entry.pointValue * -1, entry.name);
                } catch (error) {
                    console.error('Error redeeming preset:', error);
                    alert('Failed to redeem reward. Please try again.');
                } finally {
                    this.processingAction = false;
                }
            }
        },
        async logTrackingData() {
            if (!this.currentUser) {
                alert('Error: No user selected. Please select a user first.');
                return;
            }

            if (!this.trackingInput || this.trackingInput <= 0) {
                alert(`Please enter a valid ${this.trackingMetric}.`);
                return;
            }

            if (this.processingAction){
                alert('Request in progress. Please wait.');
                return;
            } 
            this.processingAction = true;
            try {
                const trackingRef = collection(db, 'users', this.currentUser, 'tracking');
                await addDoc(trackingRef, {
                    metric: this.trackingMetric,
                    value: this.trackingInput,
                    timestamp: Timestamp.now()
                });

                await this.loadTrackingData();
            } catch (error) {
                console.error(`Error logging ${this.trackingMetric} of ${this.trackingInput} for user ${this.currentUser}:`, error);
                alert('Logging failed. Please try again.');
            } finally {
                this.trackingInput = null;
                this.processingAction = false;
            }
        },
        setDateRange(days) {
            this.trackingDateRange = days;
            this.loadTrackingData();
        },
        async loadTrackingData() {
            if (!this.currentUser) return;
            
            try {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - this.trackingDateRange);
                
                const trackingRef = collection(db, 'users', this.currentUser, 'tracking');
                const q = query(
                    trackingRef,
                    where('metric', '==', this.trackingMetric),
                    where('timestamp', '>=', Timestamp.fromDate(daysAgo)),
                    orderBy('timestamp', 'asc')
                );
                
                const querySnapshot = await getDocs(q);
                this.trackingData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    this.trackingData.push({
                        value: data.value,
                        timestamp: data.timestamp.toDate()
                    });
                });
                
                // Render the chart after data is loaded
                this.$nextTick(() => {
                    this.renderTrackingChart();
                });
            } catch (error) {
                console.error('Error loading tracking data:', error);
                this.trackingData = [];
            }
        },
        renderTrackingChart() {
            const canvas = document.getElementById('trackingChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart if it exists
            if (this.trackingChart) {
                this.trackingChart.destroy();
            }
            
            // Prepare data for chart with x,y coordinate pairs
            const dataPoints = this.trackingData.map(item => ({
                x: item.timestamp,
                y: item.value
            }));
            
            this.trackingChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: this.trackingMetric.charAt(0).toUpperCase() + this.trackingMetric.slice(1),
                        data: dataPoints,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0,
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'MMM d'
                                },
                                tooltipFormat: 'MMM d, yyyy'
                            },
                            adapters: {
                                date: {}
                            },
                            display: true,
                            title: {
                                display: true,
                                text: 'Date'
                            },
                            ticks: {
                                source: 'auto',
                                autoSkip: true,
                                maxRotation: 30,
                                minRotation: 30
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: this.trackingMetric.charAt(0).toUpperCase() + this.trackingMetric.slice(1)
                            },
                            beginAtZero: false
                        }
                    }
                }
            });
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
