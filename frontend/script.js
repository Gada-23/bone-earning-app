// script.js - Complete Bone Earning App with AdsGram Integration

class BoneEarningApp {
    constructor() {
        // Initialize properties
        this.tg = null;
        this.userId = null;
        this.userData = null;
        this.isTelegramEnvironment = false;
        
        // User data
        this.balance = 0;
        this.totalEarned = 0;
        this.referralCount = 0;
        this.dailyStreak = 0;
        this.adsWatched = 0;
        this.lastClaimDate = null;
        
        // AdsGram
        this.adManager = null;
        this.blockId = 'task-b712d5b7bff5432fa9e134010fa8e045'; // ✅ Real AdsGram Block ID provided by user
        this.apiBaseUrl = 'https://your-backend.onrender.com'; // 🔧 Set your deployed backend URL
        this.adCooldownMs = 5000; // Prevent fast repeated clicks
        this.lastAdClickTime = 0;
        
        // DOM Elements
        this.initDOMElements();
        
        // Initialize app
        this.init();
    }
    
    initDOMElements() {
        // Main UI elements
        this.balanceAmount = document.getElementById('balanceAmount');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.toast = document.getElementById('toast');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Stats elements
        this.totalEarnedEl = document.getElementById('totalEarned');
        this.referralCountEl = document.getElementById('referralCount');
        this.dailyStreakEl = document.getElementById('dailyStreak');
        this.adsWatchedEl = document.getElementById('adsWatched');
        this.referralCount2El = document.getElementById('referralCount2');
        this.referralEarnedEl = document.getElementById('referralEarned');
        this.yourRankEl = document.getElementById('yourRank');
        
        // Buttons
        this.watchAdBtn = document.getElementById('watchAdBtn');
        this.withdrawBtn = document.getElementById('withdrawBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.statsBtn = document.getElementById('statsBtn');
        this.referralBtn = document.getElementById('referralBtn');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        this.viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
        
        // Sections
        this.statsSection = document.getElementById('statsSection');
        this.referralSection = document.getElementById('referralSection');
        this.referralLink = document.getElementById('referralLink');
        
        // Navigation
        this.navHome = document.getElementById('navHome');
        this.navEarn = document.getElementById('navEarn');
        this.navStats = document.getElementById('navStats');
        this.navProfile = document.getElementById('navProfile');
    }
    
    async init() {
        try {
            console.log('🦴 Bone Earning App initializing...');
            
            // Check Telegram environment
            this.checkTelegramEnvironment();
            
            // Initialize AdsGram
            this.initAdsGram();
            
            // Load user data
            await this.loadUserData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateUI();
            
            // Check daily streak and daily bonus
            this.checkDailyStreak();
            this.processDailyBonus();
            
            // Setup referral link
            this.setupReferralLink();
            
            // Hide loading
            this.hideLoading();
            
            console.log('✅ App initialized successfully');
            this.showToast('Welcome to BoneEarn! 🦴', 'success');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showToast('Failed to initialize app', 'error');
            this.hideLoading();
        }
    }
    
    checkTelegramEnvironment() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                this.tg = window.Telegram.WebApp;
                this.isTelegramEnvironment = true;
                
                // Initialize Telegram WebApp
                this.tg.ready();
                this.tg.expand();
                
                // Get user info
                if (this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
                    this.userData = this.tg.initDataUnsafe.user;
                    this.userId = this.userData.id.toString();
                    console.log('Telegram user:', this.userData);
                    
                    // Set background color
                    this.tg.setHeaderColor('#8B4513');
                } else {
                    this.userId = 'test_user_' + Math.floor(Math.random() * 1000);
                    console.log('Test user:', this.userId);
                }
            } else {
                this.userId = 'test_user_' + Math.floor(Math.random() * 1000);
                console.log('Running in browser mode - Test user:', this.userId);
            }
        } catch (error) {
            console.log('Telegram check error:', error);
            this.userId = 'test_user_' + Math.floor(Math.random() * 1000);
        }
    }
    
    initAdsGram() {
        try {
            const adContainer = document.getElementById('ad-container');

            // Task block requires the block ID created in AdsGram dashboard.
            // Example format in AdsGram dashboard for Reward URL (from your question):
            // https://bone-earning-app.vercel.app/reward.html?user=[userId]&bones=1
            // [userId] resolves to the Telegram user id inserted by AdsGram on callback.
            const taskRewardUrlTemplate = `https://bone-earning-app.vercel.app/reward.html?user=${encodeURIComponent(this.userId)}&bones=1`;

            const adElement = document.createElement('adsgram-task');
            adElement.setAttribute('data-block-id', this.blockId);
            adElement.setAttribute('data-debug', 'true'); // Set to false when live
            adElement.setAttribute('data-debug-console', 'true');
            adElement.setAttribute('data-reward-url', taskRewardUrlTemplate);

            adContainer.appendChild(adElement);

            adElement.addEventListener('reward', (event) => {
                console.log('✅ Ad completed - reward earned!', event.detail);
                this.handleAdReward(event.detail);
            });

            adElement.addEventListener('onError', (event) => {
                console.error('❌ Ad error:', event.detail);
                this.hideLoading();
                this.showToast('Ad error: ' + (event.detail?.message || 'unknown'), 'error');
            });

            adElement.addEventListener('onBannerNotFound', () => {
                console.log('⚠️ No ads available');
                this.hideLoading();
                this.showToast('No ads available, try again later', 'warning');
            });

            adElement.addEventListener('onStart', () => {
                console.log('🎬 Ad started');
            });

            this.adManager = adElement;
            console.log('📺 AdsGram initialized with block:', this.blockId, 'Reward URL:', taskRewardUrlTemplate);

        } catch (error) {
            console.error('AdsGram init error:', error);
            this.showToast('Unable to initialize AdsGram', 'error');
        }
    }

    async apiRequest(endpoint, options = {}) {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api${endpoint}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || 'Request failed');
            }
            return res.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    async loadUserData() {
        try {
            const response = await this.apiRequest(`/user/${encodeURIComponent(this.userId)}`);
            if (response.success && response.user) {
                const user = response.user;
                this.balance = user.balance || 0;
                this.totalEarned = user.totalEarned || 0;
                this.referralCount = user.referralCount || 0;
                this.dailyStreak = user.dailyStreak || 0;
                this.adsWatched = user.adsWatched || 0;
                this.lastClaimDate = user.lastClaimDate || null;
                this.referralCode = user.referralCode;
                console.log('Loaded user data from backend:', user);
                return;
            }
        } catch (error) {
            console.warn('Backend loadUserData failed, fallback to localStorage');
        }

        // Fallback to localStorage for first-time or offline use
        const storageKey = `boneApp_${this.userId}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.balance = data.balance || 0;
                this.totalEarned = data.totalEarned || 0;
                this.referralCount = data.referralCount || 0;
                this.dailyStreak = data.dailyStreak || 0;
                this.adsWatched = data.adsWatched || 0;
                this.lastClaimDate = data.lastClaimDate || null;
                console.log('Loaded user data (localStorage fallback):', data);
            } catch (e) {
                console.error('Failed to load saved data');
            }
        }

        // Ensure user exists on backend
        try {
            await this.apiRequest('/user/create', {
                method: 'POST',
                body: JSON.stringify({
                    telegramId: this.userId,
                    username: this.userData?.username || '',
                    firstName: this.userData?.first_name || '',
                    lastName: this.userData?.last_name || ''
                })
            });
        } catch (error) {
            console.warn('Failed to create user in backend on init', error.message);
        }
    }
    
    async saveUserData() {
        const data = {
            telegramId: this.userId,
            balance: this.balance,
            totalEarned: this.totalEarned,
            referralCount: this.referralCount,
            dailyStreak: this.dailyStreak,
            adsWatched: this.adsWatched,
            lastClaimDate: this.lastClaimDate
        };

        // LocalStorage backup
        const storageKey = `boneApp_${this.userId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));

        try {
            await this.apiRequest('/user/update', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            console.log('Saved user data to backend:', data);
        } catch (error) {
            console.warn('Failed saving to backend, fallback local only:', error.message);
        }
    }
    
    setupEventListeners() {
        // Main buttons
        this.watchAdBtn.addEventListener('click', () => this.handleWatchAd());
        this.withdrawBtn.addEventListener('click', () => this.handleWithdraw());
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        
        // Section buttons
        this.statsBtn.addEventListener('click', () => this.toggleSection('stats'));
        this.referralBtn.addEventListener('click', () => this.toggleSection('referral'));
        this.copyLinkBtn.addEventListener('click', () => this.handleCopyLink());
        
        // Leaderboard
        if (this.viewLeaderboardBtn) {
            this.viewLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        }
        
        // Navigation
        this.navHome.addEventListener('click', () => this.switchTab('home'));
        this.navEarn.addEventListener('click', () => this.switchTab('earn'));
        this.navStats.addEventListener('click', () => this.switchTab('stats'));
        this.navProfile.addEventListener('click', () => this.switchTab('profile'));
        
        // Listen for messages from reward page
        window.addEventListener('message', (event) => {
            if (event.data.type === 'REWARD_EARNED') {
                this.loadUserData();
                this.updateUI();
                this.showToast(`✅ +${event.data.bones} bone earned!`, 'success');
            }
        });
    }
    
    async handleWatchAd() {
        const now = Date.now();

        if (now - this.lastAdClickTime < this.adCooldownMs) {
            this.showToast('⏳ Please wait a few seconds before watching another ad.', 'warning');
            return;
        }

        this.lastAdClickTime = now;

        try {
            this.showLoading();
            this.watchAdBtn.disabled = true;

            if (!navigator.onLine) {
                throw new Error('No network connection');
            }

            if (!this.adManager) {
                // Fallback simulation for local/testing mode
                setTimeout(() => {
                    this.handleAdReward({ amount: 1 });
                }, 2000);
                return;
            }

            if (typeof this.adManager.show === 'function') {
                await this.adManager.show();
            } else {
                throw new Error('AdsGram SDK method show() unavailable');
            }

        } catch (error) {
            console.error('Ad error:', error);
            this.hideLoading();
            this.watchAdBtn.disabled = false;

            if (error.message.includes('No ads') || error.message.includes('404')) {
                this.showToast('No ads available right now. Please try later.', 'warning');
            } else if (error.message.includes('No network')) {
                this.showToast('Network issue. Check connection and retry.', 'error');
            } else {
                this.showToast('Failed to show ad: ' + error.message, 'error');
            }
        }
    }
    
    handleAdReward(detail) {
        try {
            const rewardAmount = Number(detail?.amount || 1);
            if (Number.isNaN(rewardAmount) || rewardAmount <= 0) {
                throw new Error('Invalid reward amount');
            }

            this.balance += rewardAmount;
            this.totalEarned += rewardAmount;
            this.adsWatched += 1;

            this.updateDailyStreak();
            this.saveUserData();
            this.updateUI();
            this.hideLoading();
            this.watchAdBtn.disabled = false;

            this.showToast(`✅ You earned ${rewardAmount} bone${rewardAmount > 1 ? 's' : ''}!`, 'success');

            if (this.tg && this.tg.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('success');
            }

            // send event to backend reward/Add bones endpoint
            try {
                await this.apiRequest('/user/add-bones', {
                    method: 'POST',
                    body: JSON.stringify({
                        telegramId: this.userId,
                        amount: rewardAmount,
                        source: 'ad_watch'
                    })
                });
            } catch (err) {
                console.warn('Failed to update backend on ad reward:', err.message);
            }

            // call reward page as optional callback endpoint (AdsGram compatibility)
            this.callRewardUrl(this.userId, rewardAmount);

        } catch (error) {
            console.error('Reward handling error:', error);
            this.hideLoading();
            this.watchAdBtn.disabled = false;
            this.showToast('Error processing reward: ' + error.message, 'error');
        }
    }
    
    async callRewardUrl(userId, amount) {
        const rewardUrl = `https://bone-earning-app.vercel.app/reward.html?user=${encodeURIComponent(userId)}&bones=${encodeURIComponent(amount)}`;
        console.log('Calling reward URL:', rewardUrl);
        try {
            await fetch(rewardUrl, { method: 'GET', mode: 'no-cors', cache: 'no-cache' });
        } catch (error) {
            console.warn('reward.html redirect failed', error.message);
        }

        // also trigger backend reward endpoint for AdsGram-style callback
        try {
            await this.apiRequest('/reward', {
                method: 'POST',
                body: JSON.stringify({ user_id: userId, amount, transaction_id: `js-${Date.now()}` })
            });
        } catch (error) {
            console.warn('Backend /reward callback failed', error.message);
        }
    }
    
    handleWithdraw() {
        const minimumWithdrawal = 1000;

        if (this.balance < minimumWithdrawal) {
            const needed = minimumWithdrawal - this.balance;
            this.showToast(`❌ Need ${needed} more bones to withdraw`, 'error');
            return;
        }

        const withdrawAmount = Math.floor(this.balance / 1000) * 1000;
        const remaining = this.balance - withdrawAmount;

        const request = {
            id: `wr_${Date.now()}`,
            amount: withdrawAmount,
            requestedAt: new Date().toISOString(),
            status: 'pending'
        };

        if (confirm(`Withdraw ${withdrawAmount} bones?\nRemaining: ${remaining} bones\n\nAdmin contact: @YourBotName`)) {
            this.balance = remaining;
            this.saveUserData();

            // Create withdrawal request via backend
            try {
                await this.apiRequest('/user/withdraw', {
                    method: 'POST',
                    body: JSON.stringify({
                        telegramId: this.userId,
                        amount: withdrawAmount
                    })
                });
                this.showToast(`✅ Withdrawal requested: ${withdrawAmount} bones`, 'success');
            } catch (err) {
                this.showToast(`⚠️ Network/Withdraw API error, saved locally`, 'warning');
                this.addWithdrawRequest(request);
            }

            this.updateUI();
            this.showToast(`📬 Pending withdrawals: ${this.getWithdrawRequests().length}`, 'info');
        }
    }

    getWithdrawRequests() {
        const key = `withdrawRequests_${this.userId}`;
        const raw = localStorage.getItem(key);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    addWithdrawRequest(request) {
        const key = `withdrawRequests_${this.userId}`;
        const requests = this.getWithdrawRequests();
        requests.unshift(request);
        localStorage.setItem(key, JSON.stringify(requests));
    }

    getPendingWithdrawals() {
        return this.getWithdrawRequests().filter(req => req.status === 'pending');
    }
    
    handleRefresh() {
        this.loadUserData();
        this.updateUI();
        this.showToast('🔄 Balance refreshed', 'success');
    }
    
    toggleSection(section) {
        // Hide both sections first
        this.statsSection.style.display = 'none';
        this.referralSection.style.display = 'none';
        
        // Show selected section
        if (section === 'stats') {
            this.statsSection.style.display = 'block';
            this.updateStats();
        } else if (section === 'referral') {
            this.referralSection.style.display = 'block';
        }
        
        // Scroll to section
        setTimeout(() => {
            document.querySelector(`.${section}-section`).scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
    
    async handleCopyLink() {
        try {
            await navigator.clipboard.writeText(this.referralLink.value);
            this.showToast('📋 Referral link copied!', 'success');
            
            this.copyLinkBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyLinkBtn.textContent = 'Copy';
            }, 2000);
            
        } catch (err) {
            this.showToast('Failed to copy', 'error');
        }
    }
    
    async showLeaderboard() {
        try {
            const resp = await this.apiRequest('/leaderboard');
            if (resp.success && Array.isArray(resp.leaderboard)) {
                let message = '🏆 Top Earners\n\n';
                resp.leaderboard.forEach((user, index) => {
                    message += `${index + 1}. ${user.username || user.telegramId}: ${user.balance} 🦴\n`;
                });
                this.showToast(message, 'info');
                return;
            }
        } catch (error) {
            console.warn('Leaderboard fetch failed', error.message);
        }

        // Fallback
        const leaderboard = [
            { name: 'You', score: this.totalEarned },
            { name: 'Alex', score: 2450 },
            { name: 'Sarah', score: 2100 },
            { name: 'Mike', score: 1800 }
        ].sort((a, b) => b.score - a.score);

        let message = '🏆 Top Earners\n\n';
        leaderboard.forEach((user, index) => {
            message += `${index + 1}. ${user.name}: ${user.score} 🦴\n`;
        });

        this.showToast(message, 'info');
    }
    
    switchTab(tab) {
        // Update navigation
        [this.navHome, this.navEarn, this.navStats, this.navProfile].forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Hide sections
        this.statsSection.style.display = 'none';
        this.referralSection.style.display = 'none';
        
        switch(tab) {
            case 'home':
                this.navHome.classList.add('active');
                break;
            case 'earn':
                this.navEarn.classList.add('active');
                this.showToast('💰 Watch ads to earn bones!', 'info');
                break;
            case 'stats':
                this.navStats.classList.add('active');
                this.statsSection.style.display = 'block';
                this.updateStats();
                break;
            case 'profile':
                this.navProfile.classList.add('active');
                this.showProfile();
                break;
        }
    }
    
    updateUI() {
        // Update balance
        this.balanceAmount.textContent = this.balance;
        
        // Update progress bar
        const progress = Math.min((this.balance / 1000) * 100, 100);
        this.progressBar.style.width = `${progress}%`;
        
        // Update progress text
        const remaining = Math.max(0, 1000 - this.balance);
        this.progressText.textContent = `${remaining} more to withdraw`;
        
        // Update stats
        if (this.totalEarnedEl) this.totalEarnedEl.textContent = this.totalEarned;
        if (this.referralCountEl) this.referralCountEl.textContent = this.referralCount;
        if (this.referralCount2El) this.referralCount2El.textContent = this.referralCount;
        if (this.dailyStreakEl) this.dailyStreakEl.textContent = this.dailyStreak;
        if (this.adsWatchedEl) this.adsWatchedEl.textContent = this.adsWatched;
        if (this.referralEarnedEl) this.referralEarnedEl.textContent = this.referralCount * 10;
        if (this.yourRankEl) this.yourRankEl.textContent = `${this.totalEarned} 🦴`;
    }
    
    updateStats() {
        if (this.totalEarnedEl) this.totalEarnedEl.textContent = this.totalEarned;
        if (this.referralCountEl) this.referralCountEl.textContent = this.referralCount;
        if (this.dailyStreakEl) this.dailyStreakEl.textContent = this.dailyStreak;
        if (this.adsWatchedEl) this.adsWatchedEl.textContent = this.adsWatched;
    }
    
    updateDailyStreak() {
        const today = new Date().toDateString();
        
        if (!this.lastClaimDate) {
            this.dailyStreak = 1;
        } else if (this.lastClaimDate === today) {
            return;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (this.lastClaimDate === yesterday.toDateString()) {
                this.dailyStreak++;
                
                // Bonus for streak milestones
                if (this.dailyStreak === 7) {
                    this.balance += 10;
                    this.showToast('🎉 7-day streak! +10 bonus bones!', 'success');
                } else if (this.dailyStreak === 30) {
                    this.balance += 50;
                    this.showToast('🔥 30-day streak! +50 bonus bones!', 'success');
                }
            } else {
                this.dailyStreak = 1;
            }
        }
        
        this.lastClaimDate = today;
    }
    
    checkDailyStreak() {
        const today = new Date().toDateString();

        if (!this.lastClaimDate) {
            this.dailyStreak = 0;
            return;
        }

        if (this.lastClaimDate !== today) {
            const lastDate = new Date(this.lastClaimDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate.toDateString() !== yesterday.toDateString()) {
                // Missed a day -> reset streak
                this.dailyStreak = 0;
                this.saveUserData();
            }
        }
    }

    async processDailyBonus() {
        try {
            const res = await this.apiRequest('/user/claim-daily', {
                method: 'POST',
                body: JSON.stringify({ telegramId: this.userId })
            });
            if (res.success) {
                const user = res.user;
                this.balance = user.balance;
                this.totalEarned = user.totalEarned;
                this.dailyStreak = user.dailyStreak;
                this.lastClaimDate = user.lastClaimDate;
                this.saveUserData();
                this.updateUI();
                this.showToast(`🎁 Daily bonus claimed! (+${res.bonus} bones)`, 'success');
            }
        } catch (error) {
            console.warn('Daily bonus claim failed; local fallback in place');
        }
    }
    
    setupReferralLink() {
        if (this.referralLink) {
            const botUsername = this.userData?.username || 'YourBot';
            const refCode = this.userId || 'ref123';
            this.referralLink.value = `https://t.me/${botUsername}?start=${refCode}`;
        }
    }
    
    showProfile() {
        if (this.userData && this.isTelegramEnvironment) {
            const profile = [
                `👤 ${this.userData.first_name || ''} ${this.userData.last_name || ''}`,
                `@${this.userData.username || 'N/A'}`,
                `ID: ${this.userData.id}`,
                `📱 Joined: ${new Date().toLocaleDateString()}`
            ].join('\n');
            this.showToast(profile, 'info');
        } else {
            this.showToast('👤 Guest Mode\nEarn bones by watching ads!', 'info');
        }
    }
    
    showLoading() {
        this.loadingOverlay.classList.add('show');
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }
    
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = 'toast show';
        
        if (type === 'error') this.toast.classList.add('error');
        if (type === 'success') this.toast.classList.add('success');
        if (type === 'warning') this.toast.classList.add('warning');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BoneEarningApp();
});