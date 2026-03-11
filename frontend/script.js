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
        this.blockId = '8662582443'; // 🔴 REPLACE WITH YOUR ACTUAL BLOCK ID
        
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
            
            // Check daily streak
            this.checkDailyStreak();
            
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
            // Create ad container
            const adContainer = document.getElementById('ad-container');
            
            // Create adsgram element
            const adElement = document.createElement('adsgram-task');
            adElement.setAttribute('data-block-id', this.blockId);
            adElement.setAttribute('data-debug', 'true'); // Set to false when live
            adElement.setAttribute('data-debug-console', 'true');
            
            // Add to container
            adContainer.appendChild(adElement);
            
            // Set up event listeners
            adElement.addEventListener('reward', (event) => {
                console.log('✅ Ad completed - reward earned!', event.detail);
                this.handleAdReward(event.detail);
            });
            
            adElement.addEventListener('onError', (event) => {
                console.error('❌ Ad error:', event.detail);
                this.hideLoading();
                this.showToast('Ad failed to load', 'error');
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
            console.log('📺 AdsGram initialized with block:', this.blockId);
            
        } catch (error) {
            console.error('AdsGram init error:', error);
        }
    }
    
    async loadUserData() {
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
                console.log('Loaded user data:', data);
            } catch (e) {
                console.error('Failed to load saved data');
            }
        }
    }
    
    saveUserData() {
        const storageKey = `boneApp_${this.userId}`;
        const data = {
            balance: this.balance,
            totalEarned: this.totalEarned,
            referralCount: this.referralCount,
            dailyStreak: this.dailyStreak,
            adsWatched: this.adsWatched,
            lastClaimDate: this.lastClaimDate,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log('Saved user data:', data);
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
        try {
            // Show loading
            this.showLoading();
            
            // Disable button
            this.watchAdBtn.disabled = true;
            
            // Show ad
            if (this.adManager) {
                await this.adManager.show();
            } else {
                // Fallback simulation
                setTimeout(() => {
                    this.handleAdReward({ amount: 1 });
                }, 2000);
            }
            
        } catch (error) {
            console.error('Ad error:', error);
            this.hideLoading();
            this.watchAdBtn.disabled = false;
            this.showToast('Failed to show ad', 'error');
        }
    }
    
    handleAdReward(detail) {
        try {
            // Add bones
            const rewardAmount = 1; // 1 bone per ad
            this.balance += rewardAmount;
            this.totalEarned += rewardAmount;
            this.adsWatched += 1;
            
            // Update daily streak
            this.updateDailyStreak();
            
            // Save data
            this.saveUserData();
            
            // Update UI
            this.updateUI();
            
            // Hide loading
            this.hideLoading();
            
            // Enable button
            this.watchAdBtn.disabled = false;
            
            // Show success
            this.showToast(`✅ You earned ${rewardAmount} bone!`, 'success');
            
            // Haptic feedback in Telegram
            if (this.tg && this.tg.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('success');
            }
            
            // Call reward URL (in production, this would be handled by backend)
            this.callRewardUrl(this.userId, rewardAmount);
            
        } catch (error) {
            console.error('Reward handling error:', error);
            this.hideLoading();
            this.watchAdBtn.disabled = false;
        }
    }
    
    async callRewardUrl(userId, amount) {
        // In production, this would be called by AdsGram
        // For now, we simulate it
        try {
            const rewardUrl = `https://bone-earning-app.vercel.app/reward.html?user=${userId}&bones=${amount}`;
            console.log('Calling reward URL:', rewardUrl);
            
            // Open in background (optional)
            // window.open(rewardUrl, '_blank');
            
        } catch (error) {
            console.error('Reward URL error:', error);
        }
    }
    
    handleWithdraw() {
        const minimumWithdrawal = 1000;
        
        if (this.balance >= minimumWithdrawal) {
            const withdrawAmount = Math.floor(this.balance / 1000) * 1000;
            const remaining = this.balance - withdrawAmount;
            
            if (confirm(`Withdraw ${withdrawAmount} bones?\nRemaining: ${remaining} bones`)) {
                this.balance = remaining;
                this.saveUserData();
                this.updateUI();
                this.showToast(`✅ Withdrawal requested: ${withdrawAmount} bones`, 'success');
            }
        } else {
            const needed = minimumWithdrawal - this.balance;
            this.showToast(`❌ Need ${needed} more bones to withdraw`, 'error');
        }
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
    
    showLeaderboard() {
        // Simulate leaderboard
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
        
        if (this.lastClaimDate && this.lastClaimDate !== today) {
            const lastDate = new Date(this.lastClaimDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() !== yesterday.toDateString()) {
                this.dailyStreak = 0;
                this.saveUserData();
            }
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