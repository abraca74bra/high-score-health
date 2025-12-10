import { db, collection, getDocs, doc, getDoc, setDoc, updateDoc } from './firebaseConfig.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            currentUser: null,
            availableUsers: ['angelab', 'test'],
            showUserSelector: false,
            headerTotal: 0,
            activeTab: 'Earn',
            earnData: {},
            redeemData: {},
            historyData: {},
            addPointsInput: null,
            subtractPointsInput: null,
            resetPointsInput: null,
            showIndoor: true,
            showOutdoor: true
        }
    },
    async mounted() {
        // Load the current user from localStorage
        await this.loadCurrentUser();
        
        // Get the user's point total from Firestore
        await this.loadHeaderTotal();

        // Load data for all tabs
        await this.loadTabData();
    },
    methods: {
        async loadCurrentUser() {
            // Get user from localStorage or default to first user
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser && this.availableUsers.includes(storedUser)) {
                this.currentUser = storedUser;
            } else {
                this.currentUser = this.availableUsers[0];
                localStorage.setItem('currentUser', this.currentUser);
            }
        },
        selectUser(username) {
            this.currentUser = username;
            localStorage.setItem('currentUser', username);
            this.showUserSelector = false;
            
            // Reload user-specific data
            this.loadHeaderTotal();
            this.loadHistoryData();
        },
        toggleUserSelector() {
            this.showUserSelector = !this.showUserSelector;
        },
        async loadHeaderTotal() {
            if (!this.currentUser) return;
            
            try {
                const docRef = doc(db, 'users', this.currentUser);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    this.headerTotal = docSnap.data().currentTotal || 0;
                } else {
                    // Initialize if doesn't exist
                    this.headerTotal = 0;
                    await setDoc(docRef, { 
                        currentTotal: 0,
                        username: this.currentUser,
                        createdAt: new Date().toISOString()
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
                await this.loadHistoryData();
            } catch (error) {
                console.error('Error loading tab data:', error);
            }
        },
        async loadHistoryData() {
            if (!this.currentUser) return;
            
            try {
                const historyRef = collection(db, 'users', this.currentUser, 'history');
                const querySnapshot = await getDocs(historyRef);
                const data = {};
                querySnapshot.forEach((doc) => {
                    data[doc.id] = doc.data();
                });
                this.historyData = data;
            } catch (error) {
                console.error('Error loading history:', error);
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
        async addPoints(pointsToAdd) {
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
        },
        addCustomPoints() {
            const pointsToAdd = Math.abs(parseFloat(this.addPointsInput));
            if (!pointsToAdd) {
                return;
            }
            this.addPoints(pointsToAdd);
            this.addPointsInput = null;
        },
        subtractCustomPoints() {
            const pointsToSubtract = Math.abs(parseFloat(this.subtractPointsInput));
            if (!pointsToSubtract) {
                return;
            }
            this.addPoints(pointsToSubtract * -1);
            this.subtractPointsInput = null;
        },
        async resetPoints() {
            if (!this.currentUser) return;
            
            const resetTotal = parseFloat(this.resetPointsInput);
            if (!resetTotal && resetTotal !== 0) {
                return;
            }
            this.headerTotal = resetTotal;
            
            // Save to Firestore and localStorage
            try {
                const docRef = doc(db, 'users', this.currentUser);
                await updateDoc(docRef, { currentTotal: resetTotal });
            } catch (error) {
                console.error('Error updating Firestore:', error);
            }
            localStorage.setItem("headerTotal", resetTotal);
            this.resetPointsInput = null;
        },
        earnPreset(entryId) {
            const entry = this.earnData[entryId];
            if (entry && entry.pointsByUnit) {
                // For now, use the first available point value
                // TODO: Implement UI for selecting time/unit
                const firstUnit = Object.keys(entry.pointsByUnit)[0];
                const points = entry.pointsByUnit[firstUnit];
                this.addPoints(points);
            } else if (entry && entry.pointValue) {
                this.addPoints(entry.pointValue);
            }
        },
        redeemPreset(entryId) {
            const entry = this.redeemData[entryId];
            if (entry && entry.pointValue) {
                this.addPoints(entry.pointValue * -1);
            }
        },
        viewHistory(entryId) {
            // Placeholder for future functionality
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
        }
    }
}).mount('#app');
